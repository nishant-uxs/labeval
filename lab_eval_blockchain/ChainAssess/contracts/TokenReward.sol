// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AccessControl.sol";
import "./BatchManagement.sol";

/**
 * @title EduChain Token Reward System
 * @dev Non-transferable ERC20 token for academic rewards
 */
contract EduChainToken is ERC20, Ownable, ReentrancyGuard {
    
    EduChainAccessControl public accessControl;
    BatchManagement public batchManagement;
    
    // Token is non-transferable for academic integrity
    bool public transfersEnabled = false;
    
    // Mapping to track token earnings by assignment
    mapping(address => mapping(uint256 => uint256)) public assignmentEarnings;
    mapping(address => uint256[]) public studentAssignmentIds;
    mapping(address => uint256) public totalEarnings;
    
    // Grade to token multiplier (A=100%, B=80%, C=60%, D=40%, F=0%)
    mapping(string => uint256) public gradeMultipliers;
    
    struct TokenTransaction {
        address student;
        uint256 assignmentId;
        uint256 amount;
        string grade;
        address awardedBy;
        uint256 timestamp;
        string transactionType; // "assignment_reward", "bonus", "penalty"
    }
    
    TokenTransaction[] public tokenTransactions;
    mapping(address => uint256[]) public studentTransactions;
    
    event TokensAwarded(
        address indexed student,
        uint256 indexed assignmentId,
        uint256 amount,
        string grade,
        address indexed awardedBy
    );
    
    event TokensBurned(address indexed student, uint256 amount, string reason);
    
    event GradeMultiplierUpdated(string grade, uint256 multiplier);
    
    constructor(
        address _accessControl,
        address _batchManagement,
        address _owner
    ) ERC20("EduChain Token", "EDU") Ownable(_owner) {
        require(_accessControl != address(0), "Access control address cannot be zero");
        require(_batchManagement != address(0), "Batch management address cannot be zero");
        require(_owner != address(0), "Owner address cannot be zero");
        
        accessControl = EduChainAccessControl(_accessControl);
        batchManagement = BatchManagement(_batchManagement);
        
        // Initialize grade multipliers (percentage in basis points: 10000 = 100%)
        gradeMultipliers["A"] = 10000; // 100%
        gradeMultipliers["B"] = 8000;  // 80%
        gradeMultipliers["C"] = 6000;  // 60%
        gradeMultipliers["D"] = 4000;  // 40%
        gradeMultipliers["F"] = 0;     // 0%
    }
    
    modifier onlyTeacherOrAdmin() {
        require(
            accessControl.isTeacher(msg.sender) || accessControl.isAdmin(msg.sender),
            "Only teachers or admins can award tokens"
        );
        _;
    }
    
    modifier onlyStudent(address account) {
        require(accessControl.isStudent(account), "Account must be a registered student");
        _;
    }
    
    /**
     * @dev Award tokens to student based on assignment grade (with batch verification)
     */
    function awardTokens(
        address _student,
        uint256 _assignmentId,
        uint256 _batchId,
        uint256 _baseAmount,
        string memory _grade
    ) external onlyTeacherOrAdmin onlyStudent(_student) nonReentrant {
        require(_baseAmount > 0, "Base amount must be greater than 0");
        require(gradeMultipliers[_grade] >= 0, "Invalid grade");
        require(assignmentEarnings[_student][_assignmentId] == 0, "Tokens already awarded for this assignment");
        
        // Verify teacher can award tokens to this student for this batch
        require(
            batchManagement.verifyTeacherStudentBatch(msg.sender, _student, _batchId) ||
            accessControl.isAdmin(msg.sender),
            "Teacher can only award tokens to students in their batch"
        );
        
        // Calculate actual tokens based on grade
        uint256 actualAmount = (_baseAmount * gradeMultipliers[_grade]) / 10000;
        
        if (actualAmount > 0) {
            _mint(_student, actualAmount);
            
            assignmentEarnings[_student][_assignmentId] = actualAmount;
            totalEarnings[_student] += actualAmount;
            
            // Track assignment for student
            studentAssignmentIds[_student].push(_assignmentId);
            
            // Record transaction
            TokenTransaction memory transaction = TokenTransaction({
                student: _student,
                assignmentId: _assignmentId,
                amount: actualAmount,
                grade: _grade,
                awardedBy: msg.sender,
                timestamp: block.timestamp,
                transactionType: "assignment_reward"
            });
            
            tokenTransactions.push(transaction);
            studentTransactions[_student].push(tokenTransactions.length - 1);
            
            emit TokensAwarded(_student, _assignmentId, actualAmount, _grade, msg.sender);
        }
    }
    
    /**
     * @dev Award bonus tokens (Admin only)
     */
    function awardBonusTokens(
        address _student,
        uint256 _amount,
        string memory _reason
    ) external onlyOwner onlyStudent(_student) nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        
        _mint(_student, _amount);
        totalEarnings[_student] += _amount;
        
        // Record transaction with assignmentId = 0 for bonus
        TokenTransaction memory transaction = TokenTransaction({
            student: _student,
            assignmentId: 0,
            amount: _amount,
            grade: "BONUS",
            awardedBy: msg.sender,
            timestamp: block.timestamp,
            transactionType: "bonus"
        });
        
        tokenTransactions.push(transaction);
        studentTransactions[_student].push(tokenTransactions.length - 1);
        
        emit TokensAwarded(_student, 0, _amount, "BONUS", msg.sender);
    }
    
    /**
     * @dev Burn tokens (Admin only, for penalties)
     */
    function burnTokens(
        address _student,
        uint256 _amount,
        string memory _reason
    ) external onlyOwner onlyStudent(_student) nonReentrant {
        require(balanceOf(_student) >= _amount, "Insufficient balance to burn");
        
        _burn(_student, _amount);
        
        // Record penalty transaction
        TokenTransaction memory transaction = TokenTransaction({
            student: _student,
            assignmentId: 0,
            amount: _amount,
            grade: "PENALTY",
            awardedBy: msg.sender,
            timestamp: block.timestamp,
            transactionType: "penalty"
        });
        
        tokenTransactions.push(transaction);
        studentTransactions[_student].push(tokenTransactions.length - 1);
        
        emit TokensBurned(_student, _amount, _reason);
    }
    
    /**
     * @dev Update grade multiplier (Admin only)
     */
    function updateGradeMultiplier(string memory _grade, uint256 _multiplier) external onlyOwner {
        require(_multiplier <= 10000, "Multiplier cannot exceed 100%");
        gradeMultipliers[_grade] = _multiplier;
        emit GradeMultiplierUpdated(_grade, _multiplier);
    }
    
    /**
     * @dev Get student's earnings for specific assignment
     */
    function getAssignmentEarnings(address _student, uint256 _assignmentId) external view returns (uint256) {
        return assignmentEarnings[_student][_assignmentId];
    }
    
    /**
     * @dev Get all assignments where student earned tokens
     */
    function getStudentAssignments(address _student) external view returns (uint256[] memory) {
        return studentAssignmentIds[_student];
    }
    
    /**
     * @dev Get student's total earnings
     */
    function getTotalEarnings(address _student) external view returns (uint256) {
        return totalEarnings[_student];
    }
    
    /**
     * @dev Get student's transaction history
     */
    function getStudentTransactions(address _student) external view returns (uint256[] memory) {
        return studentTransactions[_student];
    }
    
    /**
     * @dev Get transaction details
     */
    function getTransaction(uint256 _transactionId) external view returns (TokenTransaction memory) {
        require(_transactionId < tokenTransactions.length, "Transaction does not exist");
        return tokenTransactions[_transactionId];
    }
    
    /**
     * @dev Get total number of transactions
     */
    function getTotalTransactions() external view returns (uint256) {
        return tokenTransactions.length;
    }
    
    /**
     * @dev Get grade multiplier
     */
    function getGradeMultiplier(string memory _grade) external view returns (uint256) {
        return gradeMultipliers[_grade];
    }
    
    // Override transfer functions to make tokens non-transferable
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(transfersEnabled || msg.sender == owner(), "Transfers are disabled for academic integrity");
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(transfersEnabled || msg.sender == owner(), "Transfers are disabled for academic integrity");
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Enable/disable transfers (Admin only, for emergency use)
     */
    function setTransfersEnabled(bool _enabled) external onlyOwner {
        transfersEnabled = _enabled;
    }
    
    /**
     * @dev Emergency function to mint tokens (Admin only)
     */
    function emergencyMint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }
    
    /**
     * @dev Check if tokens are transferable
     */
    function areTransfersEnabled() external view returns (bool) {
        return transfersEnabled;
    }
}