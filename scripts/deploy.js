require('dotenv').config();
const fs = require('fs');
const ethers = require('ethers');

const targetDeploynetworks = [
    {
        name: 'fantomTestnet',
        rpcUrl: 'https://rpc.testnet.fantom.network',
        anycallContract: '0xD7c295E399CA928A3a14b01D760E794f1AdF8990',
        depositAmount: '0.1',
    },
    {
        name: 'rinkeby',
        rpcUrl: 'https://rinkeby.infura.io/v3/55829a267be14464af5350d4ee43e21e',
        anycallContract: '0x273a4fFcEb31B8473D51051Ad2a2EdbB7Ac8Ce02',
        depositAmount: '0.001',
    },
];

const deployGasFee = 1000000;

const ABI_PATH = 'artifacts/contracts/';
const SENDER_CONTRACT_NAME = 'AnycallV6sender';
const RECEIVER_CONTRACT_NAME = 'anycallV6receiver';

async function deploy(provider, contractName, contractArgs, gas, account) {
    const filedata = fs.readFileSync(`${ABI_PATH}${contractName}.sol/${contractName}.json`);
    const abiJson = JSON.parse((""+ filedata).trim());
    const {abi, bytecode} = abiJson;

    const contract = new ethers.ContractFactory(abi, bytecode, account);
    const options = {
        gasLimit: 1000000,
    };
    const deploying = contractArgs ? await contract.deploy(...contractArgs,options) : await contract.deploy(options);
    await deploying.deployed();
    console.log(`successed deploy:  ${contractName}: ${deploying.address}`);
    return deploying;
}

async function _deployToNetwork(network, anyCallContractAbi, wallet){
    const provider = ethers.getDefaultProvider(network.rpcUrl);
    const account = await wallet.connect(provider);
    //deploy
    const deployedContracts = {};
    deployedContracts.receiver = await deploy(provider, RECEIVER_CONTRACT_NAME, null, deployGasFee, account);
    deployedContracts.sender = await deploy(provider, SENDER_CONTRACT_NAME, [network.anycallContract, deployedContracts.receiver.address], deployGasFee, account);
    //deposit
    const anyCallContract = new ethers.Contract(network.anycallContract, anyCallContractAbi, account);
    await anyCallContract.functions.deposit(deployedContracts.sender.address, {value: ethers.utils.parseEther(network.depositAmount)});
    return deployedContracts;
}

async function main() {
    const anyCallContractAbi = JSON.parse(fs.readFileSync(`contracts/abi/AnyCallV6Proxy.json`));
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    for(let network in targetDeploynetworks){
        targetDeploynetworks[network].contracts = _deployToNetwork(targetDeploynetworks[network], anyCallContractAbi, wallet);
    }
    console.log('deploy all done')
}

main();