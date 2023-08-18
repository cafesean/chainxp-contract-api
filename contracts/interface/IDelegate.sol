// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IDelegate {
    function setClass(uint256 _id, string memory _name, string memory _description, string memory _baseUri, address _templateAddress) external returns (bool);
    function setSkill(uint256 _id, string memory _code, string memory _name, string memory _baseUri) external;
    function setAttribute(uint256 _id, string memory _name, string memory _code) external;
    function setUserAttributes(uint256 _tokenId, uint256[] memory _skillIds, uint256[] memory _skillScores, uint256[] memory _attributeIds, string[] memory _attributeValues) external;
    function registerClone(string memory _uuid, address _clone) external;
    function deregisterClone(string memory _uuid) external;
    function transferOwnership(address _address) external;
    function grantAccess(address _user, string memory _role) external returns (string memory);
    function removeAccess(address _user, address _owner, string memory _role) external returns (string memory);
    }