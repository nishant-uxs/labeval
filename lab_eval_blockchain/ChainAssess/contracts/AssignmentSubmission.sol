// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";
import "./BatchManagement.sol";

/**
 * @title Assignment Submission Contract for EduChain dApp
 * @dev Handles assignment creation, submissions, and IPFS hash storage with batch management
 */
contract AssignmentSubmission {
    
    EduChainAccessControl public accessControl;
    BatchManagement public batchManagement;
    
    struct Assignment {
        uint256 id;
        string title;
        string description;
        string ipfsHash; // For assignment instructions
        uint256 deadline;
        uint256 tokenReward;
        address teacher;
        uint256 batchId; // Batch this assignment belongs to
        bool isActive;
        uint256 createdAt;
    }
    
    struct Submission {
        uint256 id;
        uint256 assignmentId;
        address student;
        string fileName;
        string ipfsHash; // Student's submitted file
        uint256 submissionTime;
        bool isReviewed;
        string grade; // A, B, C, D, F
        string feedback;
        address reviewedBy;
        uint256 reviewedAt;
        uint256 tokensAwarded;
    }
    
    // Storage
    mapping(uint256 => Assignment) public assignments;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => uint256[]) public assignmentSubmissions; // assignmentId => submissionIds[]
    mapping(address => uint256[]) public studentSubmissions; // student => submissionIds[]
    mapping(address => uint256[]) public teacherAssignments; // teacher => assignmentIds[]
    
    uint256 public nextAssignmentId = 1;
    uint256 public nextSubmissionId = 1;
    
    // Events
    event AssignmentCreated(
        uint256 indexed assignmentId,
        address indexed teacher,
        string title,
        uint256 deadline,
        uint256 tokenReward
    );
    
    event AssignmentSubmitted(
        uint256 indexed submissionId,
        uint256 indexed assignmentId,
        address indexed student,
        string ipfsHash,
        uint256 submissionTime
    );
    
    event SubmissionReviewed(
        uint256 indexed submissionId,
        address indexed reviewer,
        string grade,
        uint256 tokensAwarded
    );
    
    event AssignmentDeactivated(uint256 indexed assignmentId, address indexed teacher);
    
    constructor(address _accessControl, address _batchManagement) {
        require(_accessControl != address(0), "Access control address cannot be zero");
        require(_batchManagement != address(0), "Batch management address cannot be zero");
        accessControl = EduChainAccessControl(_accessControl);
        batchManagement = BatchManagement(_batchManagement);
    }
    
    modifier onlyTeacher() {
        require(accessControl.isTeacher(msg.sender), "Only teachers can perform this action");
        _;
    }
    
    modifier onlyStudent() {
        require(accessControl.isStudent(msg.sender), "Only students can perform this action");
        _;
    }
    
    modifier onlyTeacherOrAdmin() {
        require(
            accessControl.isTeacher(msg.sender) || accessControl.isAdmin(msg.sender),
            "Only teachers or admins can perform this action"
        );
        _;
    }
    
    /**
     * @dev Create a new assignment for a specific batch (Teacher only)
     */
    function createAssignment(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _deadline,
        uint256 _tokenReward,
        uint256 _batchId
    ) external onlyTeacher returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_tokenReward > 0, "Token reward must be greater than 0");
        
        // Verify teacher owns the batch
        require(_isTeacherBatch(msg.sender, _batchId), "Teacher does not own this batch");
        
        uint256 assignmentId = nextAssignmentId++;
        
        assignments[assignmentId] = Assignment({
            id: assignmentId,
            title: _title,
            description: _description,
            ipfsHash: _ipfsHash,
            deadline: _deadline,
            tokenReward: _tokenReward,
            teacher: msg.sender,
            batchId: _batchId,
            isActive: true,
            createdAt: block.timestamp
        });
        
        teacherAssignments[msg.sender].push(assignmentId);
        
        emit AssignmentCreated(assignmentId, msg.sender, _title, _deadline, _tokenReward);
        
        return assignmentId;
    }
    
    /**
     * @dev Submit an assignment (Student only)
     */
    function submitAssignment(
        uint256 _assignmentId,
        string memory _fileName,
        string memory _ipfsHash
    ) external onlyStudent returns (uint256) {
        Assignment storage assignment = assignments[_assignmentId];
        require(assignment.isActive, "Assignment is not active");
        require(block.timestamp <= assignment.deadline, "Assignment deadline has passed");
        require(bytes(_fileName).length > 0, "File name cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        // Check if student belongs to the assignment's batch
        require(
            batchManagement.isStudentInBatch(msg.sender, assignment.batchId),
            "Student is not enrolled in the required batch for this assignment"
        );
        
        // Check if student has already submitted this assignment
        require(!hasStudentSubmitted(_assignmentId, msg.sender), "Student has already submitted this assignment");
        
        uint256 submissionId = nextSubmissionId++;
        
        submissions[submissionId] = Submission({
            id: submissionId,
            assignmentId: _assignmentId,
            student: msg.sender,
            fileName: _fileName,
            ipfsHash: _ipfsHash,
            submissionTime: block.timestamp,
            isReviewed: false,
            grade: "",
            feedback: "",
            reviewedBy: address(0),
            reviewedAt: 0,
            tokensAwarded: 0
        });
        
        assignmentSubmissions[_assignmentId].push(submissionId);
        studentSubmissions[msg.sender].push(submissionId);
        
        emit AssignmentSubmitted(submissionId, _assignmentId, msg.sender, _ipfsHash, block.timestamp);
        
        return submissionId;
    }
    
    /**
     * @dev Review and grade a submission (Teacher only)
     */
    function reviewSubmission(
        uint256 _submissionId,
        string memory _grade,
        string memory _feedback,
        uint256 _tokensAwarded
    ) external onlyTeacherOrAdmin {
        Submission storage submission = submissions[_submissionId];
        require(submission.id != 0, "Submission does not exist");
        require(!submission.isReviewed, "Submission already reviewed");
        
        Assignment storage assignment = assignments[submission.assignmentId];
        
        // Verify teacher can review this submission (must own the batch)
        require(
            batchManagement.verifyTeacherStudentBatch(msg.sender, submission.student, assignment.batchId) ||
            accessControl.isAdmin(msg.sender),
            "Teacher can only review submissions from their own batch"
        );
        
        // Validate grade
        require(
            keccak256(bytes(_grade)) == keccak256(bytes("A")) ||
            keccak256(bytes(_grade)) == keccak256(bytes("B")) ||
            keccak256(bytes(_grade)) == keccak256(bytes("C")) ||
            keccak256(bytes(_grade)) == keccak256(bytes("D")) ||
            keccak256(bytes(_grade)) == keccak256(bytes("F")),
            "Invalid grade. Must be A, B, C, D, or F"
        );
        
        require(_tokensAwarded <= assignment.tokenReward, "Tokens awarded cannot exceed assignment reward");
        
        submission.isReviewed = true;
        submission.grade = _grade;
        submission.feedback = _feedback;
        submission.reviewedBy = msg.sender;
        submission.reviewedAt = block.timestamp;
        submission.tokensAwarded = _tokensAwarded;
        
        emit SubmissionReviewed(_submissionId, msg.sender, _grade, _tokensAwarded);
    }
    
    /**
     * @dev Check if student has already submitted an assignment
     */
    function hasStudentSubmitted(uint256 _assignmentId, address _student) public view returns (bool) {
        uint256[] memory submissionIds = assignmentSubmissions[_assignmentId];
        
        for (uint256 i = 0; i < submissionIds.length; i++) {
            if (submissions[submissionIds[i]].student == _student) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Get assignment details
     */
    function getAssignment(uint256 _assignmentId) external view returns (Assignment memory) {
        return assignments[_assignmentId];
    }
    
    /**
     * @dev Get submission details
     */
    function getSubmission(uint256 _submissionId) external view returns (Submission memory) {
        return submissions[_submissionId];
    }
    
    /**
     * @dev Get all submissions for an assignment
     */
    function getAssignmentSubmissions(uint256 _assignmentId) external view returns (uint256[] memory) {
        return assignmentSubmissions[_assignmentId];
    }
    
    /**
     * @dev Get all submissions by a student
     */
    function getStudentSubmissions(address _student) external view returns (uint256[] memory) {
        return studentSubmissions[_student];
    }
    
    /**
     * @dev Get all assignments created by a teacher
     */
    function getTeacherAssignments(address _teacher) external view returns (uint256[] memory) {
        return teacherAssignments[_teacher];
    }
    
    /**
     * @dev Get pending submissions for review (Teacher only)
     */
    function getPendingSubmissions() external view onlyTeacherOrAdmin returns (uint256[] memory) {
        // Get all assignments by this teacher
        uint256[] memory teacherAssignmentIds = teacherAssignments[msg.sender];
        
        // Count pending submissions
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < teacherAssignmentIds.length; i++) {
            uint256[] memory submissionIds = assignmentSubmissions[teacherAssignmentIds[i]];
            for (uint256 j = 0; j < submissionIds.length; j++) {
                if (!submissions[submissionIds[j]].isReviewed) {
                    pendingCount++;
                }
            }
        }
        
        // Create array of pending submission IDs
        uint256[] memory pendingSubmissions = new uint256[](pendingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < teacherAssignmentIds.length; i++) {
            uint256[] memory submissionIds = assignmentSubmissions[teacherAssignmentIds[i]];
            for (uint256 j = 0; j < submissionIds.length; j++) {
                if (!submissions[submissionIds[j]].isReviewed) {
                    pendingSubmissions[index] = submissionIds[j];
                    index++;
                }
            }
        }
        
        return pendingSubmissions;
    }
    
    /**
     * @dev Deactivate an assignment (Teacher only)
     */
    function deactivateAssignment(uint256 _assignmentId) external onlyTeacher {
        Assignment storage assignment = assignments[_assignmentId];
        require(assignment.teacher == msg.sender, "Only assignment creator can deactivate");
        require(assignment.isActive, "Assignment is already inactive");
        
        assignment.isActive = false;
        
        emit AssignmentDeactivated(_assignmentId, msg.sender);
    }
    
    /**
     * @dev Get total submissions count
     */
    function getTotalSubmissions() external view returns (uint256) {
        return nextSubmissionId - 1;
    }
    
    /**
     * @dev Get assignments for a specific batch
     */
    function getBatchAssignments(uint256 _batchId) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count assignments for this batch
        for (uint256 i = 1; i < nextAssignmentId; i++) {
            if (assignments[i].batchId == _batchId && assignments[i].isActive) {
                count++;
            }
        }
        
        // Create array with batch assignments
        uint256[] memory batchAssignments = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextAssignmentId; i++) {
            if (assignments[i].batchId == _batchId && assignments[i].isActive) {
                batchAssignments[index] = i;
                index++;
            }
        }
        
        return batchAssignments;
    }
    
    /**
     * @dev Get student's assignments from their batches
     */
    function getStudentAvailableAssignments(address _student) external view returns (uint256[] memory) {
        uint256[] memory studentBatches = batchManagement.getStudentBatches(_student);
        uint256 count = 0;
        
        // Count assignments from all student's batches
        for (uint256 i = 0; i < studentBatches.length; i++) {
            uint256 batchId = studentBatches[i];
            for (uint256 j = 1; j < nextAssignmentId; j++) {
                if (assignments[j].batchId == batchId && assignments[j].isActive) {
                    count++;
                }
            }
        }
        
        // Create array with available assignments
        uint256[] memory availableAssignments = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < studentBatches.length; i++) {
            uint256 batchId = studentBatches[i];
            for (uint256 j = 1; j < nextAssignmentId; j++) {
                if (assignments[j].batchId == batchId && assignments[j].isActive) {
                    availableAssignments[index] = j;
                    index++;
                }
            }
        }
        
        return availableAssignments;
    }
    
    /**
     * @dev Internal function to verify teacher owns a batch
     */
    function _isTeacherBatch(address _teacher, uint256 _batchId) internal view returns (bool) {
        try batchManagement.getBatchTeacher(_batchId) returns (address batchTeacher) {
            bool isActive = batchManagement.isBatchActive(_batchId);
            return batchTeacher == _teacher && isActive;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Get total assignments count
     */
    function getTotalAssignments() external view returns (uint256) {
        return nextAssignmentId - 1;
    }
}