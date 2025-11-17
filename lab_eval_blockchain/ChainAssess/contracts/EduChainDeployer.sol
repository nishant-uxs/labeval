// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AccessControl.sol";
import "./AssignmentSubmission.sol";
import "./TokenReward.sol";
import "./BatchManagement.sol";

/**
 * @title EduChain Deployer Contract
 * @dev Factory contract to deploy all EduChain contracts with proper linking
 */
contract EduChainDeployer {
    
    event ContractsDeployed(
        address indexed admin,
        address accessControl,
        address assignmentSubmission,
        address tokenReward,
        address batchManagement,
        uint256 timestamp
    );
    
    struct DeployedContracts {
        address accessControl;
        address assignmentSubmission;
        address tokenReward;
        address batchManagement;
        address admin;
        uint256 deployedAt;
        bool isInitialized;
    }
    
    DeployedContracts public deployedContracts;
    
    /**
     * @dev Deploy all EduChain contracts
     * @param _admin Address that will have admin privileges
     */
    function deployEduChain(address _admin) external returns (
        address accessControlAddr,
        address assignmentSubmissionAddr,
        address tokenRewardAddr,
        address batchManagementAddr
    ) {
        require(_admin != address(0), "Admin address cannot be zero");
        require(!deployedContracts.isInitialized, "Contracts already deployed");
        
        // 1. Deploy Access Control Contract
        EduChainAccessControl accessControl = new EduChainAccessControl(_admin);
        accessControlAddr = address(accessControl);
        
        // 2. Deploy Assignment Submission Contract
        AssignmentSubmission assignmentSubmission = new AssignmentSubmission(accessControlAddr);
        assignmentSubmissionAddr = address(assignmentSubmission);
        
        // 3. Deploy Token Reward Contract
        EduChainToken tokenReward = new EduChainToken(accessControlAddr, _admin);
        tokenRewardAddr = address(tokenReward);
        
        // 4. Deploy Batch Management Contract
        BatchManagement batchManagement = new BatchManagement(accessControlAddr);
        batchManagementAddr = address(batchManagement);
        
        // Store deployed contract addresses
        deployedContracts = DeployedContracts({
            accessControl: accessControlAddr,
            assignmentSubmission: assignmentSubmissionAddr,
            tokenReward: tokenRewardAddr,
            batchManagement: batchManagementAddr,
            admin: _admin,
            deployedAt: block.timestamp,
            isInitialized: true
        });
        
        emit ContractsDeployed(
            _admin,
            accessControlAddr,
            assignmentSubmissionAddr,
            tokenRewardAddr,
            batchManagementAddr,
            block.timestamp
        );
        
        return (accessControlAddr, assignmentSubmissionAddr, tokenRewardAddr, batchManagementAddr);
    }
    
    /**
     * @dev Get deployed contract addresses
     */
    function getDeployedContracts() external view returns (DeployedContracts memory) {
        return deployedContracts;
    }
    
    /**
     * @dev Check if contracts are deployed
     */
    function areContractsDeployed() external view returns (bool) {
        return deployedContracts.isInitialized;
    }
    
    /**
     * @dev Get contract addresses separately
     */
    function getContractAddresses() external view returns (
        address accessControl,
        address assignmentSubmission,
        address tokenReward,
        address batchManagement
    ) {
        require(deployedContracts.isInitialized, "Contracts not deployed yet");
        
        return (
            deployedContracts.accessControl,
            deployedContracts.assignmentSubmission,
            deployedContracts.tokenReward,
            deployedContracts.batchManagement
        );
    }
    
    /**
     * @dev Get deployment info
     */
    function getDeploymentInfo() external view returns (
        address admin,
        uint256 deployedAt,
        bool isInitialized
    ) {
        return (
            deployedContracts.admin,
            deployedContracts.deployedAt,
            deployedContracts.isInitialized
        );
    }
}