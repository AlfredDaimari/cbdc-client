
// accessing all important elements


const pub_p2p = document.getElementById('pub_p2p')
const amount_p2p = document.getElementById('amount_p2p')
const submit_p2p = document.getElementById('submit_p2p')
const p2p_wallet_amount = document.getElementById('p2p_wallet_amount')
const p2p_txn_ids = document.getElementById('p2p_txn_ids')

const pub_cbdc = document.getElementById('pub_cbdc')
const amount_cbdc = document.getElementById('amount_cbdc')
const submit_cbdc = document.getElementById('submit_cbdc')
const cbdc_wallet_amount = document.getElementById('cbdc_wallet_amount')
const cbdc_txn_ids = document.getElementById('cbdc_txn_ids')



submit_p2p.addEventListener('click', () => {
    const pubKey = pub_p2p.value
    const amount = amount_p2p.value

    fetch(`http://localhost:9000/txn/send/p2p/${amount}`, {
        method: "POST",
        body: JSON.stringify({
            pubKey
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(() => {
        alert("the txn amount has been sent")
    })

})


submit_cbdc.addEventListener('click', () => {
    const pubKey = pub_cbdc.value
    const amount = amount_cbdc.value


    fetch(`http://localhost:9000/txn/send/cbdc/${amount}`,
        {
            method: "POST", body: JSON.stringify(
                {
                    pubKey
                }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => {
            alert("the txn amount has been sent")
        })
})



const init = () => {
    fetch('http://localhost:9000/log', {
        method: "GET"
    }).then((resp) => {

        if (resp["status"] == 200) {
            console.log('successfully logged in using wallet')
        }


        // txns from cbdc
        fetch('http://localhost:9000/txns/cbdc', {
            method: "GET"
        })
            .then(resp => {

                return resp.json()

            })
            .then(val => {
                console.log(val)

                const ids = []
                var amount = 0

                val.forEach(item => {
                    ids.push(item.id)
                    amount += item.amount
                })


                cbdc_wallet_amount.innerHTML = `total wallet amount: ${amount}`
                cbdc_txn_ids.innerHTML = `txns ids available: ${JSON.stringify(ids)}`

            })


        // txns from p2p
        fetch('http://localhost:9000/txns/p2p', {
            method: "GET"
        })
            .then(resp => {

                return resp.json()

            })
            .then(val => {
                console.log(val)

                const ids = []
                var amount = 0

                val.forEach(item => {
                    ids.push(item.id)
                    amount += item.amount
                })

                p2p_wallet_amount.innerHTML = `total wallet amount: ${amount}`
                p2p_txn_ids.innerHTML = `txns ids available: ${JSON.stringify(ids)}`
            })

    })
}

init()