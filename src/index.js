const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto')

const URL_C = "http://68.183.85.22:3000"
const URL_P2P = "http://68.183.85.22:4000"
const URL_P2P2 = "http://68.183.85.22:5000"
const URL_P2P3 = "http://68.183.85.22:6000"
const URL_P2P4 = "http://68.183.85.22:7000"

const app = express()

app.use(cors())
app.use(express.static(path.join("./", "public")))
app.use(express.json())


// sign in
app.get('/log', async (_, res) => {
    try {
        const keys = fs.readdirSync('./wallet')

        // if either public key or privateKey does not exist
        if (!keys.includes("publicKey.pem") || !keys.includes("privateKey.pem")) {

            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                }
            })

            const fd_pub = fs.openSync('./wallet/publicKey.pem', 'w')
            const fd_priv = fs.openSync('./wallet/privateKey.pem', 'w')

            fs.writeFileSync(fd_pub, publicKey)
            fs.writeFileSync(fd_priv, privateKey)


            // logging and giving funds to new user in cbdc
            await axios.post(`${URL_C}/create`, {
                pubKey: publicKey
            })

        }

        res.status(200).send()


    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})


// to spend txns in the p2p network
app.post('/txn/send/p2p/:amount', async (req, res) => {
    try {

        let amount = parseInt(req.params["amount"])
        let txns = fs.readFileSync('./wallet/p2p.json', { encoding: 'utf-8' })
        let privateKey = fs.readFileSync('./wallet/privateKey.pem', { encoding: 'utf-8' })

        i = 0
        txns = JSON.parse(txns)
        console.log(txns)

        while (amount > 0) {
            let txnT;

            if (amount >= parseInt(txns[i]["amount"])) {
                txnT = {
                    btxn: txns[i],
                    amount: txns[i].amount,
                    rpubKey: req.body.pubKey,
                    signature: ""
                }
            } else {
                txnT = {
                    btxn: txns[i],
                    amount: amount,
                    rpubKey: req.body.pubKey,
                    signature: ""
                }
            }

            let sig_msg = JSON.stringify(txnT.btxn)
            sig_msg += txnT.rpubKey
            sig_msg += amount.toString()

            signature = crypto.sign('sha256', Buffer.from(sig_msg), privateKey).toString('base64')
            txnT.signature = signature

            await axios.post(`${URL_P2P}/txn`, txnT)    // send signed txn to p2p network

            amount -= parseInt(txnT["amount"])
            i += 1
        }

        res.status(200).send()


    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})


// to spend txns in the cbdc network
app.post('/txn/send/cbdc/:amount', async (req, res) => {
    try {
        try {

            let amount = parseInt(req.params["amount"])
            let txns = fs.readFileSync('./wallet/cbdc.json', { encoding: 'utf-8' })
            let privateKey = fs.readFileSync('./wallet/privateKey.pem', { encoding: 'utf-8' })

            i = 0
            txns = JSON.parse(txns)
            console.log(txns)

            while (amount > 0) {
                let txnT;

                if (amount >= parseInt(txns[i]["amount"])) {
                    txnT = {
                        btxn: txns[i],
                        amount: txns[i].amount,
                        rpubKey: req.body.pubKey,
                        signature: ""
                    }
                } else {
                    txnT = {
                        btxn: txns[i],
                        amount: amount,
                        rpubKey: req.body.pubKey,
                        signature: ""
                    }
                }

                let sig_msg = JSON.stringify(txnT.btxn)
                sig_msg += txnT.rpubKey
                sig_msg += amount.toString()

                let signature = crypto.sign('sha256', Buffer.from(sig_msg), privateKey).toString('base64')
                txnT.signature = signature

                console.log(txnT)
                await axios.post(`${URL_C}/txn/spend`, txnT)    // send signed txn to p2p network

                amount -= parseInt(txnT["amount"])
                i += 1
            }

            res.status(200).send()


        } catch (e) {
            console.log(e)
            res.status(400).send()
        }

    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})


// ! to convert p2p txn to cbdc txn
app.post('/txn/tns/p2c/:id', async (req, res) => {
    try {

        const r = axios.post(`${URL_P2P}/txn/p2c/${req.params["id"]}/yes`)
        const r2 = axios.post(`${URL_P2P2}/txn/p2c/${req.params["id"]}/no`)
        const r3 = axios.post(`${URL_P2P3}/txn/p2c/${req.params["id"]}/no`)
        const r4 = axios.post(`${URL_P2P4}/txn/p2c/${req.params["id"]}/no`)


        console.log('=== Now sending requests ===')

        await axios.all([r, r2, r3, r4])

        res.status(200).send()

    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})


// ! to convert cbdc txn to p2p
app.post('/txn/tns/c2p/:id', async (req, res) => {
    try {
        await axios.post(`${URL_C}/txn/c2p/${req.params["id"]}`)
        res.status(200).send()
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})



// to get txns from the cbdc
app.get('/txns/cbdc', async (_, res) => {
    try {

        const fd_txn = fs.openSync('./wallet/cbdc.json', 'w')
        const fd_pub = fs.openSync('./wallet/publicKey.pem')
        const publicKey = fs.readFileSync(fd_pub, { encoding: "utf-8" })


        const resp = await axios.post(`${URL_C}/txns`, { pubKey: publicKey })
        const data = resp.data

        fs.writeFileSync(fd_txn, JSON.stringify(data))

        res.status(200).send(data)

    } catch (e) {
        console.log(e)
        res.status(400).send()
    }

})


//to get txns from p2p
app.get('/txns/p2p', async (_, res) => {
    try {

        const fd_txn = fs.openSync('./wallet/p2p.json', 'w')
        const fd_pub = fs.openSync('./wallet/publicKey.pem')
        const publicKey = fs.readFileSync(fd_pub, { encoding: "utf-8" })


        const resp = await axios.post(`${URL_P2P}/txns/get`, { pubKey: publicKey })
        const data = resp.data

        fs.writeFileSync(fd_txn, JSON.stringify(data))

        res.status(200).send(data)

    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})


// to get block chain information
app.get('/blockexplorer', async (_, res) => {
    try {

        const resp = await axios.get(`${URL_P2P}/blocklst`)
        const data = resp.data

        res.status(200).send(data)

    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})


app.listen(9000, () => {
    console.log('server is up and running on port 9000')
})