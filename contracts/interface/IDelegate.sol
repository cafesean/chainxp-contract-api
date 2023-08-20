// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IDelegate {
    function setClass(uint256 _id, string memory _name, string memory _description, string memory _baseUri, address _templateAddress) external returns (uint256);
    function setAttribute(uint256 _id, string memory _name, string memory _code) external returns (uint256);
    function transferOwnership(address _address) external;
    function grantAccess(address _user, string memory _role) external returns (string memory);
    function removeAccess(address _user, address _owner, string memory _role) external returns (string memory);
    }