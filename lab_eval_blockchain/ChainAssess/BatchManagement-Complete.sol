// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BatchManagement {
    struct Batch {
        uint256 id;
        string name;
        address teacher;
        address[] students;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    mapping(uint256 => Batch) public batches;
    mapping(address => uint256[]) public teacherBatches;
    mapping(uint256 => mapping(address => bool)) public isStudentInBatch;
    uint256 public nextBatchId = 1;
    
    event BatchCreated(uint256 indexed batchId, address indexed teacher, string name, uint256 timestamp);
    event StudentAddedToBatch(uint256 indexed batchId, address indexed student, uint256 timestamp);
    event StudentRemovedFromBatch(uint256 indexed batchId, address indexed student, uint256 timestamp);
    
    function createBatch(string memory _name) external returns (uint256) {
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
    
    function addStudentToBatch(uint256 _batchId, address _student) external {
        require(_batchId > 0 && _batchId < nextBatchId, "Invalid batch ID");
        require(_student != address(0), "Invalid student address");
        require(batches[_batchId].teacher == msg.sender, "Only batch teacher can add students");
        require(!isStudentInBatch[_batchId][_student], "Student already in batch");
        
        batches[_batchId].students.push(_student);
        isStudentInBatch[_batchId][_student] = true;
        batches[_batchId].updatedAt = block.timestamp;
        
        emit StudentAddedToBatch(_batchId, _student, block.timestamp);
    }
    
    function removeStudentFromBatch(uint256 _batchId, address _student) external {
        require(_batchId > 0 && _batchId < nextBatchId, "Invalid batch ID");
        require(batches[_batchId].teacher == msg.sender, "Only batch teacher can remove students");
        require(isStudentInBatch[_batchId][_student], "Student not in batch");
        
        // Remove student from array
        address[] storage students = batches[_batchId].students;
        for (uint i = 0; i < students.length; i++) {
            if (students[i] == _student) {
                students[i] = students[students.length - 1];
                students.pop();
                break;
            }
        }
        
        isStudentInBatch[_batchId][_student] = false;
        batches[_batchId].updatedAt = block.timestamp;
        
        emit StudentRemovedFromBatch(_batchId, _student, block.timestamp);
    }
    
    function getActiveTeacherBatches(address _teacher) external view returns (uint256[] memory) {
        return teacherBatches[_teacher];
    }
    
    function getBatch(uint256 _batchId) external view returns (
        uint256 id,
        string memory name,
        address teacher,
        address[] memory students,
        bool isActive,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        Batch memory batch = batches[_batchId];
        return (batch.id, batch.name, batch.teacher, batch.students, batch.isActive, batch.createdAt, batch.updatedAt);
    }
    
    function getBatchStudents(uint256 _batchId) external view returns (address[] memory) {
        return batches[_batchId].students;
    }
    
    function isStudentInBatchView(address _student, uint256 _batchId) external view returns (bool) {
        return isStudentInBatch[_batchId][_student];
    }
}