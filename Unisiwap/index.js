const blocknative = require('./blocknative')
const { watcher, txWatcher } = require('./watcher')
const isProfitable = require('./isProfitable')
const uniswap = require('./uniswap')
const emitter = blocknative.createEmitter()
const trieInit = require('./HelperFolders/trie')
const { getGas } = require('./HelperFolders/watcherValidator')
const { insertApprove } = require('./database/approvedToken')

const init = async () => {
    let myTrie = await trieInit();
    let compareGas = await getGas()
    console.log("Starting Emitter")

    emitter.on("txPool", async (event) => {
        let filteredTransaction = await watcher(event, myTrie, compareGas)
        if (filteredTransaction !== undefined) {
            let buyObj = await isProfitable(filteredTransaction);
            if (buyObj !== undefined) {
                blocknative.stopWatcher()
                let txEmitter = await blocknative.createTransactionWatcher(filteredTransaction.txHash);
                let realBuyObj = buyObj.buyObj
                if(filteredTransaction.etherValue <= 10e18) {
                    console.log(`ether value less than 10, return 0`)
                    return undefined
                }
                txEmitter.on("all", event => txWatcher(event, buyObj, buyObj.pairAddress, realBuyObj.gasPrice))
                console.log("Ready to buy")
                let buyTx = await uniswap.buyTokens(realBuyObj, buyObj.txHash)
                if(!checkApprove(buyObj.pairAddress)){
                    await uniswap.getApprove(buyObj.token.address)
                    await insertApprove(buyObj.pairAddress)
                }
            }
        }
    })
}

init()



// This is the latest version
