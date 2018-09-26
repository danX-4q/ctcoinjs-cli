// assume: node 8 or above
const ora = require("ora")
const parseArgs = require("minimist")

const {
  Qtum,
} = require("qtumjs")

const repoData = require("./solar.development.json")
const qtum = new Qtum("http://test:test@localhost:13889", repoData)
const myToken = qtum.contract("ctcoin-solidity/ctcoin.sol")

async function getbalance(callerAddr, dstAddr) {
  const res = await myToken.call("getbalance", [dstAddr],{
    senderAddress: callerAddr,
  })

  // balance is a BigNumber instance (see: bn.js)
  const balance = res.outputs[0]

  console.log(`balance:`, balance.toNumber())
}

async function transfer(fromAddr, toAddr, amount) {
  const tx = await myToken.send("transfer", [toAddr, amount], {
    senderAddress: fromAddr,
  })

  console.log("transfer tx:", tx.txid)
  console.log(tx)

  // or: await tx.confirm(1)
  const confirmation = tx.confirm(1)
  ora.promise(confirmation, "confirm transfer")
  await confirmation
}

async function deposit(fromAddr, amount) {
  const tx = await myToken.send("deposit", '', {
    senderAddress: fromAddr,
    amount: amount
  })

  console.log("deposit tx:", tx.txid)
  console.log(tx)

  // or: await tx.confirm(1)
  const confirmation = tx.confirm(1)
  ora.promise(confirmation, "confirm deposit")
  await confirmation
}

async function transport(fromAddr, toAddr, amount) {
  const tx = await myToken.send("transport", [toAddr, amount], {
    senderAddress: fromAddr
  })

  console.log("transport tx:", tx.txid)
  console.log(tx)

  // or: await tx.confirm(1)
  const confirmation = tx.confirm(1)
  ora.promise(confirmation, "confirm transport")
  await confirmation
}

async function refund(fromAddr, amount) {
  const tx = await myToken.send("refund", [amount], {
    senderAddress: fromAddr
  })

  console.log("refund tx:", tx.txid)
  console.log(tx)

  // or: await tx.confirm(1)
  const confirmation = tx.confirm(1)
  ora.promise(confirmation, "confirm refund")
  await confirmation
}

async function streamEvents() {
  console.log("Subscribed to contract events")
  console.log("Ctrl-C to terminate events subscription")

  myToken.onLog((entry) => {
    console.log(entry)
  }, { minconf: 1 })
}

async function getLogs(fromBlock, toBlock) {
  const logs = await myToken.logs({
    fromBlock,
    toBlock,
    minconf: 1,
  })

  console.log(JSON.stringify(logs, null, 2))
}

async function main() {
  const argv = parseArgs(process.argv.slice(2))

  const cmd = argv._[0]

  if (process.env.DEBUG) {
    console.log("argv", argv)
    console.log("cmd", cmd)
  }

  switch (cmd) {
    case "deposit":
    {
      const fromAddr = argv._[1]
      const amount = argv._[2]
      await deposit(fromAddr, amount)
      break
    }
    case "transport":
    {
      const fromAddr = argv._[1]
      const toAddr = argv._[2]
      var amount = argv._[3]
      const unit = argv._[4]
      if (unit === 'eth' || unit === undefined) {
        amount = parseFloat(amount) * 100000000
        amount = '' + parseInt(amount)
      } else if (unit === 'wei') {
      } else {
        console.log('undefined unit')
        return
      }
      //console.log(amount)
      //return
      await transport(fromAddr, toAddr, amount)
      break
    }
    case "refund":
    {
      const fromAddr = argv._[1]
      var amount = argv._[2]
      const unit = argv._[3]
      if (unit === 'eth' || unit === undefined) {
        amount = parseFloat(amount) * 100000000
        amount = '' + parseInt(amount)
      } else if (unit === 'wei') {
      } else {
        console.log('undefined unit')
        return
      }
      //console.log(amount)
      //return
      await refund(fromAddr, amount)
      break
    }
    case "getbalance":
    {
      const callerAddr = argv._[1]
      const dstAddr = argv._[2]
      await getbalance(callerAddr, dstAddr)
      break
    }
    case "logs":
      const fromBlock = parseInt(argv._[1]) || 0
      const toBlock = parseInt(argv._[2]) || "latest"

      await getLogs(fromBlock, toBlock)
      break
    case "events":
      await streamEvents() // logEvents will never return
      break
    default:
      console.log("unrecognized command", cmd)
  }
}

main().catch(err => {
  console.log("error", err)
})
