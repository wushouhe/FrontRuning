require('dotenv').config()
const { ChainId, Fetcher, Token, WETH, Percent } = require('@uniswap/sdk');
const chainID = ChainId.MAINNET;
const ethers = require('ethers');

const provider = ethers.getDefaultProvider('mainnet', {
    infra: process.env.INFURA
})

const slippageTolerance = new Percent('100', '100000');
const weth = WETH[chainID];
const to = process.env.TO;


const signer = new ethers.Wallet(process.env.WALLET);

const account = signer.connect(provider);

const buy = new ethers.Contract(
    process.env.UNISWAP,
    [process.env.SWAPEXACTETHFORTOKENS]
    , account
);

const sell = new ethers.Contract(
    process.env.UNISWAP,
    [process.env.SWAPEXACTTOKENSFORETH]
    , account
);

const fetchData = async (filteredTransaction) => {
    let token = new Token(ChainId.MAINNET, filteredTransaction.tokenOut, filteredTransaction.decimals)
    pair = await Fetcher.fetchPairData(token, (weth));

    return {
        token,
        pair,
    }
}

const createPath = (tokenFrom, tokenTo) => {
    return [tokenFrom.address, tokenTo.address]
}


const buyTokens = async (buyObj) => {
    await buy.swapExactETHForTokens(
        buyObj.amountOutMinHex,
        buyObj.path,
        process.env.TO,
        buyObj.deadline,
        {
            value: buyObj.inputAmountHex,
            gasPrice: buyObj.gasPrice,
            gasLimit: ethers.BigNumber.from(500000).toHexString()
        });
}

const sellTokens = async (sellObj) => {
    await sell.swapExactTokensForETH(
        sellObj.amountOutMinHex,
        sellObj.path,
        to,
        sellObj.deadline,
        {
            value: sellObj.inputAmountHex,
            gasPrice: sellObj.gasPrice,
            gasLimit: ethers.BigNumber.from(500000).toHexString()
        });
}

module.exports = {
    sellTokens,
    buyTokens,
    fetchData,
    createPath,
    weth,
    chainID,
}