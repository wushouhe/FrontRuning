const { ChainID, BuyTolerance, SellTolerance, Ethers, Weth, Buy, Sell } = require('./HelperFolders/uniswapConstants')


const { Fetcher, Trade, TokenAmount, Route, Token, TradeType, Pair, Price } = require('@uniswap/sdk');



const getInputOutput = (trade, tolerance) => {
    let amountOutMin = trade.minimumAmountOut(tolerance).raw;
    let amountOutMinHex = Ethers.BigNumber.from(amountOutMin.toString()).toHexString();
    let inputAmount = trade.inputAmount.raw;
    let inputAmountHex = Ethers.BigNumber.from(inputAmount.toString()).toHexString();

    return {
        amountOutMinHex: amountOutMinHex,
        inputAmountHex: inputAmountHex
    }
}

const getTrade = (pair, token, amount) => {

    let route = new Route([pair], token);
    let trade = new Trade(route, new TokenAmount(token, BigInt(amount)), TradeType.EXACT_INPUT);
    return trade
}

const getApprove = () => {
    const approveFunction = new Ethers.Contract(
        process.env.UNISWAP,
        ['function approve(address _spender, uint256 _value) public returns (bool success)'],
        account
    )
    console.log('Object created')
    approveFunction.approve(process.env.TO,
        {
            gasPrice: 60e9
        })
    console.log('Approved')
}


const getData = async (filteredTransaction) => {

    let token = new Token(ChainID, filteredTransaction.tokenOut, filteredTransaction.decimals)
    let buyAmount = Math.round(filteredTransaction.amountOutMin*1e5*1.02)
    
    let ethAmount = Math.round(filteredTransaction.etherValue*1e5)

    let buyTA = new TokenAmount(token, BigInt(buyAmount));
    let ethTA = new TokenAmount(Weth, BigInt(ethAmount))
    let pair = new Pair ( ethTA,buyTA)


    return {
        token,
        pair,
    }
}

const getPath = (tokenFrom, tokenTo) => {
    return [tokenFrom.address, tokenTo.address]
}

const getBuyObj = async (filteredTransaction, trade, token) => {

    let { inputAmountHex, amountOutMinHex } = getInputOutput(trade, BuyTolerance)
    let path = getPath(Weth, token)

    let txObj = {
        // frontRunningHash : filteredTransaction.txHash,
        amountOutMinHex: amountOutMinHex,
        inputAmountHex: inputAmountHex,
        path: path,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        gasPrice: filteredTransaction.gasPrice + 40e9
    }

    return txObj;

}

const getSellObj = (token, pair, buyObj) => {
    let trade = getTrade(pair, token, buyObj.amountOutMinHex)

    let amountOutMinHex = getInputOutput(trade, SellTolerance)

    let path = getPath(token, Weth)

    let txObj = {
        amountIn: buyObj.amountOutMinHex,
        amountOutMinHex: amountOutMinHex,
        path: path,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        gasPrice: buyObj.gasPrice + 10e9
    }

    return txObj;

}


const buyTokens = async (buyObj) => {
    let tx = await Buy.swapExactETHForTokens(
        buyObj.amountOutMinHex,
        buyObj.path,
        process.env.TO,
        buyObj.deadline,
        {
            value: buyObj.inputAmountHex,
            gasPrice: buyObj.gasPrice,
            gasLimit: Ethers.BigNumber.from(500000).toHexString()
        });
    await tx.wait()
    console.log(`Approve token for selling! \n`)
    return tx
}

const sellTokens = async (sellObj) => {
    let tx = await Sell.swapExactTokensForETH(
        sellObj.amountIn,
        sellObj.amountOutMinHex,
        sellObj.path,
        process.env.TO,
        sellObj.deadline,
        {
            gasPrice: sellObj.gasPrice,
            gasLimit: Ethers.BigNumber.from(500000).toHexString()
        });

    let reciept = await tx.wait();
    return reciept
}




module.exports = {
    sellTokens,
    buyTokens,
    getData,
    getApprove,
    getTrade,
    getBuyObj,
    getSellObj,
    Weth,
    ChainID,
}

const test = async () => {



    // let glitch = await Fetcher.fetchTokenData(ChainID, '0x09fd164ce0c587b433ab4a7753d4e6e8ed9e8f5f');
    // let dai = await Fetcher.fetchTokenData(ChainID, '0x6b175474e89094c44da98b954eedeac495271d0f')
    // let pair = await Fetcher.fetchPairData(dai, Weth);

    // let trade = getTrade(pair, Weth, 1e15)
    // console.log(trade);

    // let amountOutMin = trade.minimumAmountOut(BuyTolerance).raw;
    // let amountOutMinHex = Ethers.BigNumber.from(amountOutMin.toString()).toHexString();
    
    // let inputAmount = trade.inputAmount(BuyTolerance).raw
    // let inputAmountHex = Ethers.BigNumber.from(inputAmount.toString()).toHexString();

    // let path = getPath(token, Weth)

    // let tx = await Buy.swapExactETHForTokens(
    //     amountOutMinHex,
    //     path,
    //     process.env.TO,
    //     buyObj.deadline,
    //     {
    //         value: inputAmountHex,
    //         gasPrice: 1,
    //         gasLimit: Ethers.BigNumber.from(500000).toHexString()
    //     });

//     await tx.wait()
//     console.log(`Approve token for selling! \n`)



//     process.exit("Transaction FInished")
// }
}

// test()