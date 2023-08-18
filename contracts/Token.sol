// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./Access.sol";
import "./Base.sol";
import "./interface/ITemplate.sol";
import "./interface/IDelegate.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "hardhat/console.sol";

contract TokenContract is Initializable, Access, Base {
    using Counters for Counters.Counter;
    Counters.Counter classesCount;
    Counters.Counter attributeCount;

    function initialize(
        address ownerAddress,
        string memory _title,
        string memory _baseUri,
        string memory _description,
        string memory _symbol
    ) public initializer {
        _owner = ownerAddress;
        name = _title;
        baseURI = _baseUri;
        description = _description;
        symbol = _symbol;
        __ERC1155_init(baseURI);
        __Ownable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(ADMIN_ROLE, _owner);
        _setupRole(OPS_ROLE, _owner);
        initialized = true;
    }

    //see if this forces refresh on all classesURI
    // function _setClass(
    //     uint256 _classId,
    //     string memory _name,
    //     string memory _description,
    //     string memory _baseUri,
    //     address _templateAddress
    // ) public onlyOps returns (uint256 id) {
    //     uint256 increment = classes[_classId].id == 0 ? 1 : 0;

    //     class memory newClass = class({
    //         id: _classId + increment,
    //         name: _name,
    //         description: _description,
    //         classUri: _baseUri,
    //         templateAddress: _templateAddress != address(0x0)
    //             ? _templateAddress
    //             : DefaultTemplate
    //     });
    //     classes[_classId] = newClass;

    //     if (increment == 1) {
    //         classesCount.increment();
    //         emit ClassCreated(_name, classesCount.current());
    //     }
    //     return classesCount.current();
    // }

    function _setClass(
        uint256 _classId,
        string calldata _name,
        string calldata _description,
        string calldata _baseUri,
        address _templateAddress
    ) public onlyOps returns (string memory) {
        if (
            keccak256(abi.encodePacked(_name)) ==
            keccak256(abi.encodePacked("delete"))
        ) {
            delete classes[_classId];
            return "Deleted";
        }
        (bool success, bytes memory returnedData) = DelegateAddress
            .delegatecall(
                abi.encodeWithSelector(
                    IDelegate.setClass.selector,
                    _name,
                    _classId,
                    _description,
                    _baseUri,
                    _templateAddress
                )
            );
        require(success, "setClass failed");
        uint256 returnedClassID = abi.decode(returnedData, (uint256));

        emit ClassUpdated(_name, returnedClassID);
        return string.concat("Updated ", Strings.toString(returnedClassID));
    }

    function _setAttribute(
        uint256 _classId,
        uint256 _attributeId,
        string memory _name,
        string memory _code
    ) public onlyOps returns (string memory) {
        if (
            keccak256(abi.encodePacked(_name)) ==
            keccak256(abi.encodePacked("delete"))
        ) {
            delete classes[_attributeId];
            return "Deleted";
        }
        (bool success, bytes memory returnedData) = DelegateAddress
            .delegatecall(
                abi.encodeWithSelector(
                    IDelegate.setAttribute.selector,
                    _attributeId,
                    _classId,
                    _name,
                    _code
                )
            );
        require(success, "setAttribute failed");
        uint256 returnedAttributeID = abi.decode(returnedData, (uint256));

        emit ClassUpdated(_name, returnedAttributeID);
        return string.concat("Updated ", Strings.toString(returnedAttributeID));
    }

    // function setAttributes(
    //     uint256 _classId,
    //     uint256[] memory _attributeIds,
    //     string[] memory _attributeValues
    // ) public onlyOps {
    //     (bool success, ) = DelegateAddress.delegatecall(
    //         abi.encodeWithSelector(
    //             IDelegate.setUserAttributes.selector,
    //             _classId,
    //             _attributeIds,
    //             _attributeValues
    //         )
    //     );
    //     // tokenURI[_tokenId] = uri(_tokenId);
    //     // emit URI([_tokenId], _tokenId);
    //     emit URI(uri(_tokenId), _tokenId);
    // }

    //required by opensea - using classId as tokenId
    function uri(
        uint256 _classId
    ) public view virtual override returns (string memory) {
        // address _templateAddress = classes[users[_tokenId].classId]

        bytes memory dataURI;
        string memory proxyAddress = Strings.toHexString(uint160(_msgSender()));
        dataURI = abi.encodePacked(
            string.concat(
                baseURI,
                proxyAddress,
                "/",
                Strings.toString(_classId)
            )
        );
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(dataURI)
                )
            );
    }

    // Operator mint NFT function
    function mint(
        uint256 _classId,
        address _to
    ) public onlyOps returns (uint256 id) {
        require(classes[_classId].id != 0, "No xp");
        uint256 _classTokenId;
        // classes[_classId].tokenCount.increment();
        _classTokenId = mintSingle(_to, _classId);
        emit TokenCreated(_to, _classId, _classTokenId);
        return _classTokenId;
    }

    function mintBatchForClasses(
        address[] memory _to,
        uint256 _classId
    ) public onlyOps {
        for (uint256 i = 0; i < _to.length; i++) {
            // classes[_classId].tokenCount.increment();
            mintSingle(_to[i], _classId);
        }
    }

    // Interface getters
    function getAttributeCount() public view returns (uint256) {
        return attributeCount.current();
    }

    function _attributes(uint256 _id) public view returns (attribute memory) {
        return attributes[_id];
    }

    function _users(uint256 _classId, address _wallet, uint256 _classTokenId) public view onlyOps returns (uint256) {
        return users[_classId][_wallet][_classTokenId];
    }

    function _classes(uint256 _id) public view returns (class memory) {
        return classes[_id];
    }

    // function _userAttributes(
    //     uint256 _tokenId,
    //     uint256 _attributeId
    // ) public view onlyOps returns (string memory) {
    //     return userAttributes[_tokenId][_attributeId];
    // }

    function setDelegateAddress(address _address) public onlyAdmin {
        DelegateAddress = _address;
    }

    function getDelegateAddress() public view onlyOps returns (address) {
        return DelegateAddress;
    }

    function setDefaultTemplate(address _address) public onlyAdmin {
        DefaultTemplate = _address;
    }

    function getDefaultTemplate() public view onlyOps returns (address) {
        return DefaultTemplate;
    }

    function setTemplateContract(
        uint256 _classId,
        address _address
    ) public onlyOps returns (bool) {
        require(_address != address(0x0));
        classes[_classId].templateAddress = _address;

        //Request template contract to add this contract
        ITemplate(classes[_classId].templateAddress).authorizeCallingContract(
            _msgSender(),
            address(this)
        );

        console.log("setTemplateContract: %s", _address);
        return true;
    }

    function registerFactory(address _address) public onlyAdmin {
        _setupRole(ADMIN_ROLE, _address);
    }

    //need to override to avoid conflicting instances of supportsInterface
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControlUpgradeable, Base)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
