import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployer, proxyOwner, owner } = await hre.getNamedAccounts();

    // deploy a proxied contract
    await hre.deployments.deploy('SL4YMinter', {
        from: deployer,
        contract: 'SL4YMinter',
        log: true,
        proxy: {
            owner: proxyOwner,
            proxyContract: 'UUPS',
            execute: {
                init: {
                    methodName: 'initialize',
                    args: [
                        '0x0000000000000000000000000000456e65726779', // vtho
                        '0x4b85757bcf693f742003f2d5529cdc1672392f16', // sl4yer token
                        '0x3665eD160eDD2bC236fBDA83274eacA08769B0b9' // sl4yer wallet
                    ],
                }
            },
        },
        libraries: {
        },
    });

    // read data from contract
    const ugpraderRole = await hre.deployments.read('SL4YMinter', {}, 'UPGRADER_ROLE');
    if (!(await hre.deployments.read('SL4YMinter', {}, 'hasRole', ugpraderRole, owner))) {

        console.log('Granting owner UPGRADER_ROLE');
        // execute a function of the deployed contract
        await hre.deployments.execute(
            'SL4YMinter',
            { from: deployer },
            'grantRole',
            ugpraderRole,
            owner
        );
    }
    else {
        console.log('Owner already has UPGRADER_ROLE');
    }

    // access deployed address
    const SL4YMinter = await hre.deployments.get('SL4YMinter');
    console.log('SL4YMinter is available at', SL4YMinter.address)
};

func.id = 'swap-upgradeable'; // name your deployment
func.tags = ['swap', 'upgradeable']; // tag your deployment, to run certain tags only
func.dependencies = []; // build a dependency tree based on tags, to run deployments in a certain order

export default func;
