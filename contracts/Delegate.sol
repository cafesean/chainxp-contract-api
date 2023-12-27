// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./Base.sol";
import "./Access.sol";

// import "hardhat/console.sol";

contract DelegateContract is Initializable, Access, Base {
    using Counters for Counters.Counter;
    Counters.Counter classesCount;
    Counters.Counter attributeCount;

    //use format: https://somedomain.com/{id}.json
    function initialize() public initializer {
        _owner = _msgSender();
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(ADMIN_ROLE, _owner);
        _setupRole(OPS_ROLE, _owner);
        _setupRole(SYS_ROLE, _owner);
    }

    function setClass(
        uint256 _classId,
        string calldata _name,
        string calldata _description,
        string memory _baseUri,
        bool fungible
    ) external onlyOps returns (uint256 id) {
        if (_classId == 0) {
            if (fungible) {
                classesCount.increment();
            }
            _classId = classesCount.current();
        }
        class memory newClass = class({
            id: _classId,
            tokenCount: classes[_classId].tokenCount,
            name: _name,
            description: _description,
            classUri: bytes(_baseUri).length != 0
                ? _baseUri
                : classes[_classId].classUri
        });
        classes[_classId] = newClass;
        return _classId;
    }

    function setAttribute(
        uint256 _id,
        uint256 _classId,
        string memory _name,
        string memory _value
    ) external onlyOps {
        require(_classId > 0, "No class ID");

        attributes[_classId][_id].name = _name;
        attributes[_classId][_id].value = _value;
    }


    // function burnBatchByClass(uint256 _classId) public onlyAdmin {
    //     for (uint256 _userId = 1; _userId <= tokenCount.current(); _userId++) {
    //         require(users[_classId][users[_userId].wallet][] <> 0);
    //         require(
    //             balanceOf(users[_userId].wallet, users[_userId].id) > 0,
    //             "Nothing to burn"
    //         );
    //         _burn(users[_userId].wallet, users[_userId].id, 1);
    //     }
    // }

    function destroy() external onlyAdmin {
        selfdestruct(payable(_owner));
    }

    //need to override to avoid conflicting instances of supportsInterface
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(Base, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
