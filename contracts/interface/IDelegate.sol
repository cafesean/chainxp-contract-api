// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IDelegate {
    function setClass(
        uint256 _id,
        string memory _name,
        string memory _description,
        string memory _baseUri,
        bool fungible
    ) external returns (uint256);

    // function setUserAttributes(
    //     uint256 _classId,
    //     uint256[] memory _attributeIds,
    //     string[] memory _attributeNames,
    //     string[] memory _attributeValues
    // ) external;

    function setAttribute(
        uint256 _id,
        uint256 _classId,
        string memory _name,
        string memory _value
    ) external;

    function transferOwnership(address _address) external;

    function grantAccess(
        address _user,
        string memory _role
    ) external returns (string memory);

    function removeAccess(
        address _user,
        address _owner,
        string memory _role
    ) external returns (string memory);
}
