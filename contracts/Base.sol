// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Access.sol";
import "hardhat/console.sol";

contract Base is
    Initializable,
    ERC1155Upgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155SupplyUpgradeable,
    OwnableUpgradeable,
    Access
{
    using Strings for uint256;
    address public _owner;
    string public name;
    string public description;
    string public symbol;
    string public baseURI;
    address public DelegateAddress;

    //event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    // event ClassURI(string classUri, uint256 indexed classId);
    event TokenCreated(
        address userAddress,
        uint256 indexed classId,
        uint256 indexed tokenId
    );
    event ClassUpdated(string name, uint256 indexed classId);
    event AttributeUpdated(string status, uint256 indexed attributeId);
    event TokenTxn(
        string txnType,
        address fromAddress,
        address indexed toAddress,
        uint256 indexed classId,
        uint256 tokenId
    );

    struct class {
        uint256 id;
        uint256 tokenCount;
        string name;
        string description;
        string classUri;
    }

    struct attribute {
        uint256 id;
        string code;
        string name;
        bool visible;
        bool active;
    }
    // mapping(uint256 => string) public tokenURI;
    // mapping(uint256 => string) public classURI;
    mapping(uint256 => class) public classes;
    mapping(uint256 => attribute) public attributes; // classId => attributeId
    mapping(uint256 => mapping(address => uint256)) public users; // classId => user address => balance

    bool initialized = false;

    function initializeBase() public initializer {
        initialized = true;
    }

    // function owner() public view returns (address) {
    //     return _owner;
    // }

    function setOwner(address _newOwner) public onlyOwner {
        require(msg.sender == _owner, "Not the owner");
        _owner = _newOwner;
    }

    function _checkOwner() internal view virtual override {
        require(msg.sender == _owner, "Not the owner");
    }

    // Initial address for contract metadata
    function contractURI() external view returns (string memory) {
        string memory contractAddress = Strings.toHexString(
            uint160(address(this))
        );

        return
            string(
                abi.encodePacked(baseURI, contractAddress, "/contract.json")
            );
    }

    function setBaseURI(string memory _baseURI) public onlyOps {
        baseURI = _baseURI;
    }

    // function updateUsersClass(
    //     address[] memory _ids,
    //     uint256 _newClassId
    // ) public onlyOps {
    //     for (uint256 i = 0; i < _ids.length; i++) {
    //         users[_newClassId][_ids[i]] += 1;
    //     }
    //     _setURI("n");
    // }
    function swap(
        address _userAddress,
        uint256 _oldClassId,
        uint256 _newClassId
    ) public onlyOps returns (uint256) {
        safeTransferFrom(_userAddress, address(0), _oldClassId, 1, bytes(""));
        _mint(_userAddress, _newClassId, 1, "");
        classes[_newClassId].tokenCount += 1;
        classes[_oldClassId].tokenCount -= 1;
        users[_newClassId][_userAddress] += 1;
        users[_oldClassId][_userAddress] -= 1;
        return classes[_newClassId].tokenCount;
    }

    function mintSingle(
        address _to,
        uint256 _classId
    ) public onlyForwarder returns (uint256) {
        _mint(_to, _classId, 1, "");
        classes[_classId].tokenCount += 1;
        users[_classId][_to] += 1;
        return classes[_classId].tokenCount;
    }

    function burn(
        address _account,
        uint256 _classId,
        uint256 _amount
    ) public override onlyOps {
        require(balanceOf(_account, _classId) > 0, "No token");
        _burn(_account, _classId, _amount);
        users[_classId][_account] -= 1;
        emit TokenTxn("burn", _account, address(0), _classId, _amount);
    }

    // function burnBatchById(uint256[] memory _ids) public onlyOps {
    //     updateUsersClass(_ids, 0);
    //     for (uint256 i = 0; i < _ids.length; i++) {
    //         if (balanceOf(users[_ids[i]].wallet, _ids[i]) != 0) {
    //             _burn(users[_ids[i]].wallet, _ids[i], 1);
    //         }
    //     }
    // }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override onlyOps {
        _safeTransferFrom(from, to, id, amount, data);
        emit TokenTxn("transfer", from, to, id, amount);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        require(
            from == address(0) || to == address(0),
            "Soulbound token not transferrable"
        );
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    //custom ownable functions
    function transferOwnership(address newOwner) public override onlyOwner {
        require(
            newOwner != address(0x0),
            "Ownable: new owner is the zero address"
        );
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    //need to override to avoid conflicting instances of supportsInterface
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
