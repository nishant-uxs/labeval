// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NFTReward
 * @dev NFT certificates for exceptional performance
 */
contract NFTReward is ERC721, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant TEACHER_ROLE = keccak256("TEACHER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    Counters.Counter private _tokenIdCounter;

    struct NFTMetadata {
        string assignmentId;
        string achievementType;
        string description;
        uint256 timestamp;
        address awardedBy;
    }

    mapping(uint256 => NFTMetadata) private _nftMetadata;
    mapping(address => uint256[]) private _studentNFTs;

    event NFTAwarded(
        address indexed student,
        uint256 indexed tokenId,
        string indexed assignmentId,
        string achievementType,
        address awardedBy
    );

    constructor() ERC721("EduChain Achievement", "ECA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(TEACHER_ROLE, msg.sender);
    }

    /**
     * @dev Award NFT to student (Teacher/Admin only)
     */
    function awardNFT(
        address _student,
        string memory _assignmentId,
        string memory _achievementType,
        string memory _description
    ) external onlyRole(TEACHER_ROLE) returns (uint256) {
        require(_student != address(0), "Invalid student address");
        require(bytes(_assignmentId).length > 0, "Assignment ID cannot be empty");
        require(bytes(_achievementType).length > 0, "Achievement type cannot be empty");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(_student, tokenId);

        _nftMetadata[tokenId] = NFTMetadata({
            assignmentId: _assignmentId,
            achievementType: _achievementType,
            description: _description,
            timestamp: block.timestamp,
            awardedBy: msg.sender
        });

        _studentNFTs[_student].push(tokenId);

        emit NFTAwarded(_student, tokenId, _assignmentId, _achievementType, msg.sender);

        return tokenId;
    }

    /**
     * @dev Get NFT metadata
     */
    function getNFTMetadata(uint256 _tokenId) external view returns (NFTMetadata memory) {
        require(_exists(_tokenId), "NFT does not exist");
        return _nftMetadata[_tokenId];
    }

    /**
     * @dev Get all NFTs owned by student
     */
    function getStudentNFTs(address _student) external view returns (uint256[] memory) {
        return _studentNFTs[_student];
    }

    /**
     * @dev Get total NFTs minted
     */
    function getTotalNFTs() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Override tokenURI to return metadata
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        // In production, this would return actual metadata JSON URI
        // For now, return a placeholder
        return string(abi.encodePacked("https://api.educhain.com/nft/", toString(tokenId)));
    }

    /**
     * @dev Convert uint to string
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Override supportsInterface to include AccessControl
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}