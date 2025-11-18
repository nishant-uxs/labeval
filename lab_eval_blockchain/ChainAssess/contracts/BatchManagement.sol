// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";

/**
 * @title Batch Management Contract for EduChain dApp
 * @dev Manages student batches created by teachers
 */
contract BatchManagement {
    
    EduChainAccessControl public accessControl;
    
    struct Batch {
        uint256 id;
        string name;
        address teacher;
        address[] students;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // Storage
    mapping(uint256 => Batch) public batches;
    mapping(address => uint256[]) public teacherBatches; // teacher => batchIds[]
    mapping(address => mapping(uint256 => bool)) public studentInBatch; // student => batchId => isInBatch
    mapping(address => uint256[]) public studentBatches; // student => batchIds[]
    
    uint256 public nextBatchId = 1;
    
    // Events
    event BatchCreated(
        uint256 indexed batchId,
        address indexed teacher,
        string name,
        uint256 timestamp
    );
    
    event StudentAddedToBatch(
        uint256 indexed batchId,
        address indexed student,
        address indexed teacher,
        uint256 timestamp
    );
    
    event StudentRemovedFromBatch(
        uint256 indexed batchId,
        address indexed student,
        address indexed teacher,
        uint256 timestamp
    );
    
    event BatchDeactivated(
        uint256 indexed batchId,
        address indexed teacher,
        uint256 timestamp
    );
    
    event BatchRenamed(
        uint256 indexed batchId,
        string oldName,
        string newName,
        address indexed teacher,
        uint256 timestamp
    );
    
    constructor(address _accessControl) {
        require(_accessControl != address(0), "Access control address cannot be zero");
        accessControl = EduChainAccessControl(_accessControl);
    }
    
    modifier onlyTeacher() {
        require(accessControl.isTeacher(msg.sender), "Only teachers can perform this action");
        _;
    }
    
    modifier onlyBatchTeacher(uint256 _batchId) {
        require(batches[_batchId].teacher == msg.sender, "Only the batch creator can manage this batch");
        require(batches[_batchId].isActive, "Batch is not active");
        _;
    }
    
    modifier validBatch(uint256 _batchId) {
        require(_batchId > 0 && _batchId < nextBatchId, "Invalid batch ID");
        require(batches[_batchId].isActive, "Batch is not active");
        _;
    }
    
    /**
     * @dev Create a new batch (Teacher only)
     */
    function createBatch(string memory _name) external onlyTeacher returns (uint256) {
        require(bytes(_name).length > 0, "Batch name cannot be empty");
        require(bytes(_name).length <= 100, "Batch name too long");
        
        uint256 batchId = nextBatchId++;
        
        batches[batchId] = Batch({
            id: batchId,
            name: _name,
            teacher: msg.sender,
            students: new address[](0),
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        teacherBatches[msg.sender].push(batchId);
        
        emit BatchCreated(batchId, msg.sender, _name, block.timestamp);
        
        return batchId;
    }
    
    /**
     * @dev Add a student to a batch (Only batch teacher)
     */
    function addStudentToBatch(uint256 _batchId, address _student) 
        external 
        onlyBatchTeacher(_batchId) 
    {
        require(_student != address(0), "Student address cannot be zero");
        require(!studentInBatch[_student][_batchId], "Student already in this batch");
        
        Batch storage batch = batches[_batchId];
        batch.students.push(_student);
        batch.updatedAt = block.timestamp;
        
        studentInBatch[_student][_batchId] = true;
        studentBatches[_student].push(_batchId);
        
        emit StudentAddedToBatch(_batchId, _student, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Add multiple students to a batch (Only batch teacher)
     */
    function addMultipleStudentsToBatch(uint256 _batchId, address[] memory _students) 
        external 
        onlyBatchTeacher(_batchId) 
    {
        require(_students.length > 0, "Students array cannot be empty");
        require(_students.length <= 50, "Too many students in one transaction");
        
        Batch storage batch = batches[_batchId];
        
        for (uint256 i = 0; i < _students.length; i++) {
            address student = _students[i];
            
            require(student != address(0), "Student address cannot be zero");
            
            if (!studentInBatch[student][_batchId]) {
                batch.students.push(student);
                studentInBatch[student][_batchId] = true;
                studentBatches[student].push(_batchId);
                
                emit StudentAddedToBatch(_batchId, student, msg.sender, block.timestamp);
            }
        }
        
        batch.updatedAt = block.timestamp;
    }
    
    /**
     * @dev Remove a student from a batch (Only batch teacher)
     */
    function removeStudentFromBatch(uint256 _batchId, address _student) 
        external 
        onlyBatchTeacher(_batchId) 
    {
        require(studentInBatch[_student][_batchId], "Student not in this batch");
        
        Batch storage batch = batches[_batchId];
        
        // Remove from students array
        for (uint256 i = 0; i < batch.students.length; i++) {
            if (batch.students[i] == _student) {
                batch.students[i] = batch.students[batch.students.length - 1];
                batch.students.pop();
                break;
            }
        }
        
        // Remove from student's batch list
        uint256[] storage studentBatchList = studentBatches[_student];
        for (uint256 i = 0; i < studentBatchList.length; i++) {
            if (studentBatchList[i] == _batchId) {
                studentBatchList[i] = studentBatchList[studentBatchList.length - 1];
                studentBatchList.pop();
                break;
            }
        }
        
        studentInBatch[_student][_batchId] = false;
        batch.updatedAt = block.timestamp;
        
        emit StudentRemovedFromBatch(_batchId, _student, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Rename a batch (Only batch teacher)
     */
    function renameBatch(uint256 _batchId, string memory _newName) 
        external 
        onlyBatchTeacher(_batchId) 
    {
        require(bytes(_newName).length > 0, "Batch name cannot be empty");
        require(bytes(_newName).length <= 100, "Batch name too long");
        
        Batch storage batch = batches[_batchId];
        string memory oldName = batch.name;
        batch.name = _newName;
        batch.updatedAt = block.timestamp;
        
        emit BatchRenamed(_batchId, oldName, _newName, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Deactivate a batch (Only batch teacher)
     */
    function deactivateBatch(uint256 _batchId) 
        external 
        onlyBatchTeacher(_batchId) 
    {
        Batch storage batch = batches[_batchId];
        batch.isActive = false;
        batch.updatedAt = block.timestamp;
        
        // Remove all students from batch
        for (uint256 i = 0; i < batch.students.length; i++) {
            address student = batch.students[i];
            studentInBatch[student][_batchId] = false;
            
            // Remove from student's batch list
            uint256[] storage studentBatchList = studentBatches[student];
            for (uint256 j = 0; j < studentBatchList.length; j++) {
                if (studentBatchList[j] == _batchId) {
                    studentBatchList[j] = studentBatchList[studentBatchList.length - 1];
                    studentBatchList.pop();
                    break;
                }
            }
        }
        
        emit BatchDeactivated(_batchId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Check if a student is in a specific batch
     */
    function isStudentInBatch(address _student, uint256 _batchId) 
        external 
        view 
        returns (bool) 
    {
        return studentInBatch[_student][_batchId];
    }
    
    /**
     * @dev Get batch details
     */
    function getBatch(uint256 _batchId) 
        external 
        view 
        validBatch(_batchId) 
        returns (Batch memory) 
    {
        return batches[_batchId];
    }
    
    /**
     * @dev Get batch teacher (simpler version for external contracts)
     */
    function getBatchTeacher(uint256 _batchId) 
        external 
        view 
        validBatch(_batchId) 
        returns (address) 
    {
        return batches[_batchId].teacher;
    }
    
    /**
     * @dev Check if batch is active
     */
    function isBatchActive(uint256 _batchId) 
        external 
        view 
        validBatch(_batchId) 
        returns (bool) 
    {
        return batches[_batchId].isActive;
    }
    
    /**
     * @dev Get students in a batch
     */
    function getBatchStudents(uint256 _batchId) 
        external 
        view 
        validBatch(_batchId) 
        returns (address[] memory) 
    {
        return batches[_batchId].students;
    }
    
    /**
     * @dev Get batches created by a teacher
     */
    function getTeacherBatches(address _teacher) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return teacherBatches[_teacher];
    }
    
    /**
     * @dev Get batches a student belongs to
     */
    function getStudentBatches(address _student) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return studentBatches[_student];
    }
    
    /**
     * @dev Get active batches for a teacher
     */
    function getActiveTeacherBatches(address _teacher) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory allBatches = teacherBatches[_teacher];
        uint256 activeCount = 0;
        
        // Count active batches
        for (uint256 i = 0; i < allBatches.length; i++) {
            if (batches[allBatches[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array with active batches only
        uint256[] memory activeBatches = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allBatches.length; i++) {
            if (batches[allBatches[i]].isActive) {
                activeBatches[index] = allBatches[i];
                index++;
            }
        }
        
        return activeBatches;
    }
    
    /**
     * @dev Get batch statistics
     */
    function getBatchStats(uint256 _batchId) 
        external 
        view 
        validBatch(_batchId) 
        returns (
            string memory name,
            address teacher,
            uint256 studentCount,
            uint256 createdAt,
            uint256 updatedAt
        ) 
    {
        Batch storage batch = batches[_batchId];
        return (
            batch.name,
            batch.teacher,
            batch.students.length,
            batch.createdAt,
            batch.updatedAt
        );
    }
    
    /**
     * @dev Get total number of batches
     */
    function getTotalBatches() external view returns (uint256) {
        return nextBatchId - 1;
    }
    
    /**
     * @dev Verify teacher can manage student in batch (for external contracts)
     */
    function verifyTeacherStudentBatch(
        address _teacher, 
        address _student, 
        uint256 _batchId
    ) external view returns (bool) {
        if (!batches[_batchId].isActive) return false;
        if (batches[_batchId].teacher != _teacher) return false;
        return studentInBatch[_student][_batchId];
    }
}