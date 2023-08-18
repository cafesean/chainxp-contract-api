// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Access.sol";
import "./interface/IProxy.sol";
import "hardhat/console.sol";

contract FactoryContract is OwnableUpgradeable, Access {
    bool public initialized;
    address public _owner;
    address[] public proxies;

    event ProxyCloned(address cloneAddress);

    modifier OnlyOwner() {
        require(_msgSender() == _owner, "Only the owner can clone");
        _;
    }

    function initialize() public initializer {
        // __Ownable_init();
        _owner = _msgSender();
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(ADMIN_ROLE, _owner);
        _setupRole(OPS_ROLE, _owner);
        _setupRole(SYS_ROLE, _owner);
        initialized = true;
    }

    function createClone(
        address target,
        string memory _title,
        string memory _baseUri,
        string memory _description,
        string memory _symbol
    ) public onlyAdmin returns (address) {
        bytes20 targetBytes = bytes20(target);
        address proxy;

        assembly {
            let clone := mload(0x40)
            mstore(
                clone,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(clone, 0x14), targetBytes)
            mstore(
                add(clone, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            proxy := create(0, clone, 0x37)
        }
        IProxy(proxy).initialize(
            _owner,
            _title,
            _baseUri,
            _description,
            _symbol
        );
        proxies.push(proxy);
        emit ProxyCloned(proxy);
        return proxy;
    }
}
