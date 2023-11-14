// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./Access.sol";
import "./Base.sol";
import "./interface/IDelegate.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

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
        string memory _symbol,
        uint8 _fungible
    ) public initializer {
        _owner = ownerAddress;
        name = _title;
        baseURI = _baseUri;
        description = _description;
        symbol = _symbol;
        fungible = _fungible;
        __ERC1155_init(baseURI);
        __Ownable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(ADMIN_ROLE, _owner);
        _setupRole(OPS_ROLE, _owner);
        initialized = true;
    }

    function mint(uint256 _classId) external onlyForwarder returns (uint256 id) {
        uint256 _tokenId;
        if (fungible == 1) {
            if (classes[_classId].id == 0) {
                revert ErrorMessage("No XP");
            }
            _tokenId = mintFT(_msgSender(), _classId);
        } else {
            classesCount.increment();
            _tokenId = classesCount.current();
            mintNFT(_msgSender(), _tokenId);
            emit URI(uri(_classId), _tokenId);
        }
        emit TokenCreated(_msgSender(), _classId, _tokenId);
        return _tokenId;
    }

    function mintBatchForClasses(
        address[] calldata _to,
        uint256 _classId
    ) external onlyOps {
        for (uint256 i; i < _to.length; ++i) {
            // classes[_classId].tokenCount.increment();
            mintFT(_to[i], _classId);
        }
    }

    function _setClass(
        uint256 _classId,
        string calldata _name,
        string calldata _description,
        string calldata _baseUri
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
                    _classId,
                    _name,
                    _description,
                    _baseUri
                )
            );
        if (!success) {
            revert ErrorMessage("setClass failed");
        }
        uint256 returnedClassID = abi.decode(returnedData, (uint256));
        emit ClassUpdated(_name, returnedClassID);
        emit URI(uri(returnedClassID), returnedClassID);
        return string.concat("Updated ", Strings.toString(returnedClassID));
    }

    //required by opensea - using classId as tokenId
    function uri(
        uint256 _classId
    ) public view virtual override returns (string memory) {
        string memory proxyAddress = Strings.toHexString(
            uint160(address(this))
        );
        return
            string.concat(
                baseURI,
                proxyAddress,
                "/",
                Strings.toString(_classId)
            );
    }

    function _users(
        uint256 _classId,
        address _address
    ) public view onlyOps returns (uint256) {
        return users[_classId][_address];
    }

    function _classes(uint256 _id) public view onlyOps returns (class memory) {
        return classes[_id];
    }

    function setDelegateAddress(address _address) external onlyAdmin {
        DelegateAddress = _address;
        _setupRole(OPS_ROLE, _address);
    }

    function getDelegateAddress() external view onlyOps returns (address) {
        return DelegateAddress;
    }

    function registerFactory(address _address) external onlyAdmin {
        _setupRole(ADMIN_ROLE, _address);
    }

    function _msgSender() internal view override returns (address signer) {
        signer = msg.sender;
        if (msg.data.length >= 20 && hasRole(FORWARDER_ROLE, signer)) {
            assembly {
                signer := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        }
    }

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

    receive() external payable {
        revert();
    }

    fallback() external payable onlyOps {
        (bool success, bytes memory returnedData) = DelegateAddress
            .delegatecall(msg.data);
        if (!success) {
            revert ErrorMessage("Delegatecall failed");
        }
        if (returnedData.length > 0) {
            assembly {
                return(add(0x20, returnedData), mload(returnedData))
            }
        }
    }
}
