// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AccessControl Contract for EduChain dApp
 * @dev Manages role-based access control for teachers, students, and admins
 */
contract EduChainAccessControl is AccessControl, ReentrancyGuard {
    
    // Define role constants
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant TEACHER_ROLE = keccak256("TEACHER_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    
    // Events for role management
    event TeacherRegistered(address indexed teacher, address indexed admin);
    event StudentRegistered(address indexed student, address indexed admin);
    
    // Mapping to track registration timestamps
    mapping(address => uint256) public registrationTime;
    mapping(bytes32 => address[]) private roleMembers;
    
    constructor(address admin) {
        require(admin != address(0), "Admin address cannot be zero");
        
        // Grant admin role to the contract deployer
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, msg.sender); // Also grant to deployer for setup
        
        registrationTime[admin] = block.timestamp;
        registrationTime[msg.sender] = block.timestamp;
    }
    
    /**
     * @dev Register a new teacher (Admin only)
     * @param teacher Address of the teacher to register
     */
    function registerTeacher(address teacher) external onlyRole(ADMIN_ROLE) {
        require(teacher != address(0), "Teacher address cannot be zero");
        require(!hasRole(TEACHER_ROLE, teacher), "Address already has teacher role");
        
        _grantRole(TEACHER_ROLE, teacher);
        registrationTime[teacher] = block.timestamp;
        roleMembers[TEACHER_ROLE].push(teacher);
        
        emit TeacherRegistered(teacher, msg.sender);
    }
    
    /**
     * @dev Register a new student (Admin or Teacher)
     * @param student Address of the student to register
     */
    function registerStudent(address student) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(TEACHER_ROLE, msg.sender),
            "Only admin or teacher can register students"
        );
        require(student != address(0), "Student address cannot be zero");
        require(!hasRole(STUDENT_ROLE, student), "Address already has student role");
        
        _grantRole(STUDENT_ROLE, student);
        registrationTime[student] = block.timestamp;
        roleMembers[STUDENT_ROLE].push(student);
        
        emit StudentRegistered(student, msg.sender);
    }
    
    /**
     * @dev Revoke teacher role (Admin only)
     * @param teacher Address of the teacher to revoke
     */
    function revokeTeacher(address teacher) external onlyRole(ADMIN_ROLE) {
        require(hasRole(TEACHER_ROLE, teacher), "Address does not have teacher role");
        
        _revokeRole(TEACHER_ROLE, teacher);
        _removeFromRoleMembers(TEACHER_ROLE, teacher);
        
        emit RoleRevoked(TEACHER_ROLE, teacher, msg.sender);
    }
    
    /**
     * @dev Revoke student role (Admin only)
     * @param student Address of the student to revoke
     */
    function revokeStudent(address student) external onlyRole(ADMIN_ROLE) {
        require(hasRole(STUDENT_ROLE, student), "Address does not have student role");
        
        _revokeRole(STUDENT_ROLE, student);
        _removeFromRoleMembers(STUDENT_ROLE, student);
        
        emit RoleRevoked(STUDENT_ROLE, student, msg.sender);
    }
    
    /**
     * @dev Get all teachers
     * @return Array of teacher addresses
     */
    function getAllTeachers() external view returns (address[] memory) {
        return _getActiveRoleMembers(TEACHER_ROLE);
    }
    
    /**
     * @dev Get all students
     * @return Array of student addresses
     */
    function getAllStudents() external view returns (address[] memory) {
        return _getActiveRoleMembers(STUDENT_ROLE);
    }
    
    /**
     * @dev Check if an address is a verified teacher
     * @param account Address to check
     * @return bool True if address has teacher role
     */
    function isTeacher(address account) external view returns (bool) {
        return hasRole(TEACHER_ROLE, account);
    }
    
    /**
     * @dev Check if an address is a verified student
     * @param account Address to check
     * @return bool True if address has student role
     */
    function isStudent(address account) external view returns (bool) {
        return hasRole(STUDENT_ROLE, account);
    }
    
    /**
     * @dev Check if an address is an admin
     * @param account Address to check
     * @return bool True if address has admin role
     */
    function isAdmin(address account) external view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }
    
    /**
     * @dev Get user's primary role
     * @param account Address to check
     * @return string User's role (admin, teacher, student, or none)
     */
    function getUserRole(address account) external view returns (string memory) {
        if (hasRole(ADMIN_ROLE, account)) return "admin";
        if (hasRole(TEACHER_ROLE, account)) return "teacher";
        if (hasRole(STUDENT_ROLE, account)) return "student";
        return "none";
    }
    
    /**
     * @dev Get registration timestamp for an address
     * @param account Address to check
     * @return uint256 Registration timestamp
     */
    function getRegistrationTime(address account) external view returns (uint256) {
        return registrationTime[account];
    }
    
    // Internal function to remove address from role members array
    function _removeFromRoleMembers(bytes32 role, address account) internal {
        address[] storage members = roleMembers[role];
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == account) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }
    }
    
    // Internal function to get active role members (filters out revoked roles)
    function _getActiveRoleMembers(bytes32 role) internal view returns (address[] memory) {
        address[] memory allMembers = roleMembers[role];
        uint256 activeCount = 0;
        
        // Count active members
        for (uint256 i = 0; i < allMembers.length; i++) {
            if (hasRole(role, allMembers[i])) {
                activeCount++;
            }
        }
        
        // Create array with active members only
        address[] memory activeMembers = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allMembers.length; i++) {
            if (hasRole(role, allMembers[i])) {
                activeMembers[index] = allMembers[i];
                index++;
            }
        }
        
        return activeMembers;
    }
    
    /**
     * @dev Emergency function to update contract (Admin only)
     * Can be used to migrate to new contract versions
     */
    function emergencyPause() external onlyRole(ADMIN_ROLE) {
        // Implementation for emergency pause if needed
        // This is a placeholder for future emergency functionality
    }
}