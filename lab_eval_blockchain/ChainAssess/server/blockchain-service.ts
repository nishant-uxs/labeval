import { ethers } from 'ethers';
import {
  CONTRACT_ADDRESSES,
  SEPOLIA_CONFIG,
  ROLE_HASHES,
  ACCESS_CONTROL_ABI,
  BATCH_MANAGEMENT_ABI,
  ASSIGNMENT_SUBMISSION_ABI,
  TOKEN_REWARD_ABI,
} from '@shared/contracts';
import type { BatchData, AssignmentData, SubmissionData } from '@shared/contracts';
import { Cache } from './cache';
import { createLogger } from './logger';

const log = createLogger('blockchain');

// Cache: 30s TTL for reads, invalidated on writes
const cache = new Cache(30_000);

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private accessControl: ethers.Contract;
  private batchManagement: ethers.Contract;
  private assignmentSubmission: ethers.Contract;
  private tokenReward: ethers.Contract;

  constructor() {
    const alchemyApiKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyApiKey) {
      log.warn('ALCHEMY_API_KEY not set — blockchain calls will fail. Set it in .env');
    }

    const rpcUrl = alchemyApiKey
      ? `${SEPOLIA_CONFIG.rpcUrl}/${alchemyApiKey}`
      : `${SEPOLIA_CONFIG.rpcUrl}/demo`;
    log.info('Initializing blockchain service');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    this.accessControl = new ethers.Contract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI as unknown as string[], this.provider);
    this.batchManagement = new ethers.Contract(CONTRACT_ADDRESSES.batchManagement, BATCH_MANAGEMENT_ABI as unknown as string[], this.provider);
    this.assignmentSubmission = new ethers.Contract(CONTRACT_ADDRESSES.assignmentSubmission, ASSIGNMENT_SUBMISSION_ABI as unknown as string[], this.provider);
    this.tokenReward = new ethers.Contract(CONTRACT_ADDRESSES.tokenReward, TOKEN_REWARD_ABI as unknown as string[], this.provider);

    log.info('Blockchain service initialized', {
      accessControl: CONTRACT_ADDRESSES.accessControl,
      batchManagement: CONTRACT_ADDRESSES.batchManagement,
      assignmentSubmission: CONTRACT_ADDRESSES.assignmentSubmission,
      tokenReward: CONTRACT_ADDRESSES.tokenReward,
    });
  }

  // --------------- Wallet ---------------

  async initializeWithWallet(privateKey: string) {
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.accessControl = new ethers.Contract(CONTRACT_ADDRESSES.accessControl, ACCESS_CONTROL_ABI as unknown as string[], this.signer);
    this.batchManagement = new ethers.Contract(CONTRACT_ADDRESSES.batchManagement, BATCH_MANAGEMENT_ABI as unknown as string[], this.signer);
    this.assignmentSubmission = new ethers.Contract(CONTRACT_ADDRESSES.assignmentSubmission, ASSIGNMENT_SUBMISSION_ABI as unknown as string[], this.signer);
    this.tokenReward = new ethers.Contract(CONTRACT_ADDRESSES.tokenReward, TOKEN_REWARD_ABI as unknown as string[], this.signer);
    log.info('Server wallet initialized', { address: this.signer.address });
  }

  private requireSigner(): ethers.Wallet {
    if (!this.signer) throw new Error('Server wallet not initialized — set PRIVATE_KEY env var');
    return this.signer;
  }

  // --------------- Role Management (no hardcoded fallbacks) ---------------

  async getUserRole(address: string): Promise<'admin' | 'teacher' | 'student' | 'none'> {
    const cacheKey = `role:${address.toLowerCase()}`;
    const cached = cache.get<'admin' | 'teacher' | 'student' | 'none'>(cacheKey);
    if (cached) return cached;

    try {
      const [isAdmin, isTeacher, isStudent] = await Promise.all([
        this.accessControl.hasRole(ROLE_HASHES.ADMIN, address).catch(() => false),
        this.accessControl.hasRole(ROLE_HASHES.TEACHER, address).catch(() => false),
        this.accessControl.hasRole(ROLE_HASHES.STUDENT, address).catch(() => false),
      ]);

      let role: 'admin' | 'teacher' | 'student' | 'none' = 'none';
      if (isAdmin) role = 'admin';
      else if (isTeacher) role = 'teacher';
      else if (isStudent) role = 'student';

      cache.set(cacheKey, role, 60_000); // cache role for 60s
      return role;
    } catch (error) {
      log.error('Failed to determine user role', { address, error: String(error) });
      return 'none';
    }
  }

  async isAdmin(address: string): Promise<boolean> {
    return (await this.getUserRole(address)) === 'admin';
  }

  async isTeacher(address: string): Promise<boolean> {
    return (await this.getUserRole(address)) === 'teacher';
  }

  async isStudent(address: string): Promise<boolean> {
    return (await this.getUserRole(address)) === 'student';
  }

  // --------------- Admin Registration ---------------

  async registerTeacher(teacherAddress: string): Promise<{ transactionHash: string }> {
    this.requireSigner();
    log.info('Registering teacher', { teacherAddress });

    const tx = await this.accessControl.registerTeacher(teacherAddress);
    const receipt = await tx.wait();
    cache.invalidate(`role:${teacherAddress.toLowerCase()}`);
    log.info('Teacher registered', { txHash: receipt.hash });
    return { transactionHash: receipt.hash };
  }

  async registerStudent(studentAddress: string): Promise<{ transactionHash: string }> {
    this.requireSigner();
    log.info('Registering student', { studentAddress });

    const tx = await this.accessControl.registerStudent(studentAddress);
    const receipt = await tx.wait();
    cache.invalidate(`role:${studentAddress.toLowerCase()}`);
    log.info('Student registered', { txHash: receipt.hash });
    return { transactionHash: receipt.hash };
  }

  // --------------- Batch Management ---------------

  private async getTotalBatchCount(): Promise<number> {
    const cacheKey = 'batchCount';
    const cached = cache.get<number>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const nextId = await this.batchManagement.nextBatchId();
      const count = Number(nextId) - 1;
      cache.set(cacheKey, count, 15_000);
      return count;
    } catch {
      log.warn('Cannot determine batch count, defaulting to 50');
      return 50;
    }
  }

  async getBatch(batchId: number): Promise<BatchData | null> {
    const cacheKey = `batch:${batchId}`;
    const cached = cache.get<BatchData | null>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const result = await this.batchManagement.batches(batchId);

      if (!Array.isArray(result) || result.length < 6) {
        cache.set(cacheKey, null);
        return null;
      }

      const [id, name, teacher, isActive, createdAt, updatedAt] = result;
      if (!name || name === '') {
        cache.set(cacheKey, null);
        return null;
      }

      let students: string[] = [];
      try {
        students = await this.batchManagement.getBatchStudents(batchId);
      } catch {
        log.debug('Could not fetch students for batch', { batchId });
      }

      const batch: BatchData = {
        id: Number(id),
        name,
        teacher,
        students: Array.from(students),
        isActive,
        createdAt: new Date(Number(createdAt) * 1000),
        updatedAt: new Date(Number(updatedAt) * 1000),
      };

      cache.set(cacheKey, batch);
      return batch;
    } catch (error) {
      log.error('Failed to get batch', { batchId, error: String(error) });
      return null;
    }
  }

  private async fetchAllBatchesParallel(): Promise<BatchData[]> {
    const total = await this.getTotalBatchCount();
    if (total === 0) return [];

    // Fetch in parallel batches of 10 to avoid overwhelming the RPC
    const CONCURRENCY = 10;
    const allBatches: BatchData[] = [];

    for (let start = 1; start <= total; start += CONCURRENCY) {
      const end = Math.min(start + CONCURRENCY - 1, total);
      const promises: Promise<BatchData | null>[] = [];
      for (let i = start; i <= end; i++) {
        promises.push(this.getBatch(i));
      }
      const results = await Promise.all(promises);
      for (const b of results) {
        if (b) allBatches.push(b);
      }
    }

    return allBatches;
  }

  async getAllBatches(): Promise<BatchData[]> {
    const cacheKey = 'allBatches';
    const cached = cache.get<BatchData[]>(cacheKey);
    if (cached) return cached;

    const batches = await this.fetchAllBatchesParallel();
    cache.set(cacheKey, batches);
    log.info('Fetched all batches', { count: batches.length });
    return batches;
  }

  async getTeacherBatches(teacherAddress: string): Promise<BatchData[]> {
    const addr = teacherAddress.toLowerCase();
    const cacheKey = `teacherBatches:${addr}`;
    const cached = cache.get<BatchData[]>(cacheKey);
    if (cached) return cached;

    const all = await this.fetchAllBatchesParallel();
    const filtered = all.filter(b => b.teacher.toLowerCase() === addr);
    cache.set(cacheKey, filtered);
    log.info('Fetched teacher batches', { teacher: addr, count: filtered.length });
    return filtered;
  }

  async getStudentBatches(studentAddress: string): Promise<BatchData[]> {
    const addr = studentAddress.toLowerCase();
    const cacheKey = `studentBatches:${addr}`;
    const cached = cache.get<BatchData[]>(cacheKey);
    if (cached) return cached;

    const all = await this.fetchAllBatchesParallel();
    const filtered = all.filter(b =>
      b.isActive && b.students.some(s => s.toLowerCase() === addr)
    );
    cache.set(cacheKey, filtered);
    log.info('Fetched student batches', { student: addr, count: filtered.length });
    return filtered;
  }

  async getBatchStudents(batchId: number): Promise<string[]> {
    const batch = await this.getBatch(batchId);
    return batch?.students ?? [];
  }

  async createBatch(name: string, _teacherAddress: string): Promise<{ id: number; transactionHash: string }> {
    this.requireSigner();
    log.info('Creating batch', { name });

    const tx = await this.batchManagement.createBatch(name);
    const receipt = await tx.wait();

    let batchId = 0;
    const event = receipt.logs.find((l: any) => {
      try { return this.batchManagement.interface.parseLog(l)?.name === 'BatchCreated'; }
      catch { return false; }
    });
    if (event) {
      const parsed = this.batchManagement.interface.parseLog(event);
      batchId = Number(parsed?.args.batchId);
    }

    cache.invalidatePattern('batch');
    cache.invalidatePattern('allBatches');
    cache.invalidatePattern('teacherBatches');
    log.info('Batch created', { batchId, txHash: receipt.hash });
    return { id: batchId, transactionHash: receipt.hash };
  }

  async addStudentToBatch(batchId: number, studentAddress: string): Promise<string> {
    this.requireSigner();
    const tx = await this.batchManagement.addStudentToBatch(batchId, studentAddress);
    const receipt = await tx.wait();
    cache.invalidatePattern('batch');
    cache.invalidatePattern('studentBatches');
    cache.invalidatePattern('allBatches');
    log.info('Student added to batch', { batchId, studentAddress, txHash: receipt.hash });
    return receipt.hash;
  }

  async removeStudentFromBatch(batchId: number, studentAddress: string): Promise<string> {
    this.requireSigner();
    const tx = await this.batchManagement.removeStudentFromBatch(batchId, studentAddress);
    const receipt = await tx.wait();
    cache.invalidatePattern('batch');
    cache.invalidatePattern('studentBatches');
    cache.invalidatePattern('allBatches');
    log.info('Student removed from batch', { batchId, studentAddress, txHash: receipt.hash });
    return receipt.hash;
  }

  async deactivateBatch(batchId: number): Promise<string> {
    this.requireSigner();
    const tx = await this.batchManagement.deactivateBatch(batchId);
    const receipt = await tx.wait();
    cache.invalidatePattern('batch');
    cache.invalidatePattern('allBatches');
    cache.invalidatePattern('teacherBatches');
    cache.invalidatePattern('studentBatches');
    log.info('Batch deactivated', { batchId, txHash: receipt.hash });
    return receipt.hash;
  }

  async renameBatch(batchId: number, newName: string): Promise<string> {
    this.requireSigner();
    const tx = await this.batchManagement.renameBatch(batchId, newName);
    const receipt = await tx.wait();
    cache.invalidatePattern('batch');
    cache.invalidatePattern('allBatches');
    cache.invalidatePattern('teacherBatches');
    log.info('Batch renamed', { batchId, newName, txHash: receipt.hash });
    return receipt.hash;
  }

  // --------------- Assignment Helpers ---------------

  private parseAssignment(raw: any): AssignmentData {
    return {
      id: Number(raw.id),
      title: raw.title,
      description: raw.description,
      ipfsHash: raw.ipfsHash,
      deadline: new Date(Number(raw.deadline) * 1000),
      tokenReward: Number(raw.tokenReward),
      teacher: raw.teacher,
      batchId: Number(raw.batchId),
      isActive: raw.isActive,
      createdAt: new Date(Number(raw.createdAt) * 1000),
    };
  }

  private parseSubmission(raw: any): SubmissionData {
    return {
      id: Number(raw.id),
      assignmentId: Number(raw.assignmentId),
      student: raw.student,
      fileName: raw.fileName,
      ipfsHash: raw.ipfsHash,
      submittedAt: new Date(Number(raw.submittedAt) * 1000),
      isGraded: raw.isGraded,
      grade: raw.grade,
      tokensAwarded: Number(raw.tokensAwarded),
      gradedBy: raw.gradedBy,
      gradedAt: raw.gradedAt ? new Date(Number(raw.gradedAt) * 1000) : null,
    };
  }

  private async fetchAssignmentsByIds(ids: bigint[] | number[]): Promise<AssignmentData[]> {
    const CONCURRENCY = 10;
    const results: AssignmentData[] = [];

    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const chunk = ids.slice(i, i + CONCURRENCY);
      const promises = chunk.map(id =>
        this.assignmentSubmission.getAssignment(id)
          .then((raw: any) => this.parseAssignment(raw))
          .catch((err: any) => { log.debug('Failed to fetch assignment', { id: String(id), error: String(err) }); return null; })
      );
      const batch = await Promise.all(promises);
      for (const a of batch) {
        if (a) results.push(a);
      }
    }

    return results;
  }

  private async fetchSubmissionsByIds(ids: bigint[] | number[]): Promise<SubmissionData[]> {
    const CONCURRENCY = 10;
    const results: SubmissionData[] = [];

    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const chunk = ids.slice(i, i + CONCURRENCY);
      const promises = chunk.map(id =>
        this.assignmentSubmission.getSubmission(id)
          .then((raw: any) => this.parseSubmission(raw))
          .catch((err: any) => { log.debug('Failed to fetch submission', { id: String(id), error: String(err) }); return null; })
      );
      const batch = await Promise.all(promises);
      for (const s of batch) {
        if (s) results.push(s);
      }
    }

    return results;
  }

  // --------------- Assignment Management ---------------

  async getAssignment(assignmentId: number): Promise<AssignmentData | null> {
    const cacheKey = `assignment:${assignmentId}`;
    const cached = cache.get<AssignmentData>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.assignmentSubmission.getAssignment(assignmentId);
      const parsed = this.parseAssignment(raw);
      cache.set(cacheKey, parsed);
      return parsed;
    } catch (error) {
      log.error('Failed to get assignment', { assignmentId, error: String(error) });
      return null;
    }
  }

  async getTeacherAssignments(teacherAddress: string): Promise<AssignmentData[]> {
    const cacheKey = `teacherAssignments:${teacherAddress.toLowerCase()}`;
    const cached = cache.get<AssignmentData[]>(cacheKey);
    if (cached) return cached;

    try {
      const ids = await this.assignmentSubmission.getTeacherAssignments(teacherAddress);
      const assignments = await this.fetchAssignmentsByIds(ids);
      cache.set(cacheKey, assignments);
      return assignments;
    } catch (error) {
      log.error('Failed to get teacher assignments', { teacherAddress, error: String(error) });
      return [];
    }
  }

  async getStudentAssignments(studentAddress: string, batchId?: number): Promise<AssignmentData[]> {
    try {
      const ids = await this.assignmentSubmission.getStudentAvailableAssignments(studentAddress);
      const assignments = await this.fetchAssignmentsByIds(ids);
      if (batchId !== undefined) {
        return assignments.filter(a => a.batchId === batchId);
      }
      return assignments;
    } catch (error) {
      log.error('Failed to get student assignments', { studentAddress, error: String(error) });
      return [];
    }
  }

  async getBatchAssignments(batchId: string): Promise<AssignmentData[]> {
    const cacheKey = `batchAssignments:${batchId}`;
    const cached = cache.get<AssignmentData[]>(cacheKey);
    if (cached) return cached;

    try {
      const ids = await this.assignmentSubmission.getBatchAssignments(parseInt(batchId));
      const assignments = await this.fetchAssignmentsByIds(ids);
      cache.set(cacheKey, assignments);
      log.info('Fetched batch assignments', { batchId, count: assignments.length });
      return assignments;
    } catch (error) {
      log.error('Failed to get batch assignments', { batchId, error: String(error) });
      return [];
    }
  }

  async getAssignmentsByIds(assignmentIds: number[]): Promise<AssignmentData[]> {
    return this.fetchAssignmentsByIds(assignmentIds);
  }

  async getActiveAssignments(): Promise<AssignmentData[]> {
    // TODO: implement via getTotalAssignments + scanning, with caching
    return [];
  }

  async createAssignment(
    title: string,
    description: string,
    ipfsHash: string,
    deadline: number,
    tokenReward: number,
    batchId: number,
    _teacherAddress: string
  ): Promise<{ assignmentId: number; transactionHash: string }> {
    this.requireSigner();
    log.info('Creating assignment', { title, batchId });

    const tx = await this.assignmentSubmission.createAssignment(title, description, ipfsHash, deadline, tokenReward, batchId);
    const receipt = await tx.wait();

    let assignmentId = 0;
    const event = receipt.logs.find((l: any) => {
      try { return this.assignmentSubmission.interface.parseLog(l)?.name === 'AssignmentCreated'; }
      catch { return false; }
    });
    if (event) {
      const parsed = this.assignmentSubmission.interface.parseLog(event);
      assignmentId = Number(parsed?.args.assignmentId || parsed?.args[0]);
    }

    cache.invalidatePattern('assignment');
    cache.invalidatePattern('batchAssignments');
    cache.invalidatePattern('teacherAssignments');
    log.info('Assignment created', { assignmentId, txHash: receipt.hash });
    return { assignmentId, transactionHash: receipt.hash };
  }

  // --------------- Submission Management ---------------

  async getSubmission(submissionId: number): Promise<SubmissionData | null> {
    try {
      const raw = await this.assignmentSubmission.getSubmission(submissionId);
      return this.parseSubmission(raw);
    } catch (error) {
      log.error('Failed to get submission', { submissionId, error: String(error) });
      return null;
    }
  }

  async getStudentSubmissions(studentAddress: string): Promise<SubmissionData[]> {
    try {
      const ids = await this.assignmentSubmission.getStudentSubmissions(studentAddress);
      return await this.fetchSubmissionsByIds(ids);
    } catch (error) {
      log.error('Failed to get student submissions', { studentAddress, error: String(error) });
      return [];
    }
  }

  async getAssignmentSubmissions(assignmentId: number): Promise<(SubmissionData & { ipfsUrl: string })[]> {
    try {
      const ids = await this.assignmentSubmission.getAssignmentSubmissions(assignmentId);
      const subs = await this.fetchSubmissionsByIds(ids);
      return subs.map(s => ({ ...s, ipfsUrl: `https://gateway.pinata.cloud/ipfs/${s.ipfsHash}` }));
    } catch (error) {
      log.error('Failed to get assignment submissions', { assignmentId, error: String(error) });
      return [];
    }
  }

  async submitAssignment(
    assignmentId: number,
    ipfsHash: string,
    fileName: string,
    _studentAddress: string
  ): Promise<{ submissionId: number; transactionHash: string; blockNumber?: number; gasUsed?: string }> {
    this.requireSigner();
    log.info('Submitting assignment', { assignmentId, fileName });

    const tx = await this.assignmentSubmission.submitAssignment(assignmentId, fileName, ipfsHash);
    const receipt = await tx.wait();

    let submissionId = 0;
    const event = receipt.logs.find((l: any) => {
      try { return this.assignmentSubmission.interface.parseLog(l)?.name === 'AssignmentSubmitted'; }
      catch { return false; }
    });
    if (event) {
      const parsed = this.assignmentSubmission.interface.parseLog(event);
      submissionId = Number(parsed?.args.submissionId || parsed?.args[0]);
    }

    log.info('Assignment submitted', { submissionId, txHash: receipt.hash });
    return {
      submissionId,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
    };
  }

  async gradeSubmission(submissionId: number, grade: string, _teacherAddress: string): Promise<{ transactionHash: string }> {
    this.requireSigner();
    log.info('Grading submission', { submissionId, grade });

    const tx = await this.assignmentSubmission.gradeSubmission(submissionId, grade);
    const receipt = await tx.wait();

    log.info('Submission graded', { submissionId, txHash: receipt.hash });
    return { transactionHash: receipt.hash };
  }

  // --------------- Token ---------------

  async getTokenTransactions(userAddress: string): Promise<any[]> {
    try {
      const balance = await this.tokenReward.balanceOf(userAddress);
      const balanceNumber = Number(balance);

      if (balanceNumber > 0) {
        return [{ id: 1, userAddress, amount: balanceNumber, type: 'balance', createdAt: new Date() }];
      }
      return [];
    } catch (error) {
      log.error('Failed to get token balance', { userAddress, error: String(error) });
      return [];
    }
  }

  async getNftRewards(_userAddress: string): Promise<any[]> {
    // NFT rewards not yet implemented in contracts
    return [];
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
