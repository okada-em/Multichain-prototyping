// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

interface CallProxy{
    function anyCall(
        address _to,
        bytes calldata _data,
        address _fallback,
        uint256 _toChainID,
        uint256 _flags

    ) external;
}

contract AnycallV6sender {

    // The Multichain anycall contract on bnb mainnet
    address private anycallContract;

    address private owneraddress=0xDD9a5cfafF49e1312CA3a05c2237B51058c4392d;

    // Destination contract on Polygon
    address private receiverContract;

    constructor(address _anycallProxyContract, address _receiverContract){
        anycallContract = _anycallProxyContract;
        receiverContract = _receiverContract;
    }

    modifier onlyowner() {
        require(msg.sender == owneraddress, "only owner can call this method");
        _;
    }

    event NewMsg(string msg);

    function changereceivercontract(address newreceiver) external onlyowner {
        receiverContract=newreceiver;
    }

    function step1_initiateAnyCallSimple(uint256 _toChainId, string calldata _msg) external {
        emit NewMsg(_msg);
        if (msg.sender == owneraddress){
            CallProxy(anycallContract).anyCall(
                receiverContract,
                abi.encode(_msg),
                address(0),
                _toChainId,
                0
            );
        }

    }
}