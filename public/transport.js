// file for transporting the coins between the networks



const id_p2p = document.getElementById('amount_p2p')
const submit_p2p = document.getElementById('submit_p2p')
const p2p_wallet_amount = document.getElementById('p2p_wallet_amount')
const p2p_txn_ids = document.getElementById('p2p_txn_ids')

const id_cbdc = document.getElementById('amount_cbdc')
const submit_cbdc = document.getElementById('submit_cbdc')
const cbdc_wallet_amount = document.getElementById('cbdc_wallet_amount')
const cbdc_txn_ids = document.getElementById('cbdc_txn_ids')




submit_p2p.addEventListener('click', () => {
    const id = id_p2p.value

    fetch(`http://localhost:9000/txn/tns/p2c/${id}`, {
        method: "POST",
    }).then(() => {
        alert("the txn -> sent to cbdc")
    })

})


submit_cbdc.addEventListener('click', () => {
    const id = id_cbdc.value


    fetch(`http://localhost:9000/txn/tns/c2p/${id}`,
        {
            method: "POST",
        }).then(() => {
            alert("the txn -> sent to p2p")
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