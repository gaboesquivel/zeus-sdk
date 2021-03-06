const providerRunHandler = require('../run/dapp-services-node');

const artifacts = require('../../tools/eos/artifacts');
const deployer = require('../../tools/eos/deployer');
const { getCreateAccount } = require('../../tools/eos/utils');
const { loadModels } = require('../../tools/models');

const { dappServicesContract, testProvidersList } = require('../../tools/eos/dapp-services');
const servicescontract = dappServicesContract;
const liquidxcontract = "liquidx";
var servicesC = artifacts.require(`./dappservicex/`);
var liquidXC = artifacts.require(`./liquidx/`);

async function deployLocalExtensions(sidechain) {
  var deployedContract = await deployer.deploy(servicesC, servicescontract, null, sidechain);
  var deployedContractLiquidX = await deployer.deploy(liquidXC, liquidxcontract);

  await deployedContract.contractInstance.init({
    chain_name: sidechain.name,
    is_sister_chain: sidechain.is_sister_chain === true,
  }, {
    authorization: `${servicescontract}@active`,
    broadcast: true,
    sign: true
  });

  return { deployedContractLiquidX, deployedContract };
}

module.exports = async(args) => {
  if (args.creator !== 'eosio') { return; } // only local
  var testProviders = testProvidersList;

  var sidechains = await loadModels('local-sidechains');
  // for each sidechain
  for (var i = 0; i < sidechains.length; i++) {
    var sidechain = sidechains[i];
    const { deployedContractLiquidX, deployedContract } = await deployLocalExtensions(sidechain);
    for (var pi = 0; pi < testProviders.length; pi++) {
      var testProvider = testProviders[pi];
      await getCreateAccount(testProvider, null, false, sidechain);
      if (sidechain.is_sister_chain) {
        // TODO: set DSP mapping in both sides in liquidx deployedContractLiquidX.contractInstance.addaccount (mainnet) and deployedContract.contractInstance.setlink (on sidechain)
      }

    }
  }
};
