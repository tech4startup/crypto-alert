import axios from "axios";

const API_URL = "https://api.coinmarketcap.com/v1/ticker/?limit=4";

axios
	.get(API_URL)
	.then(response => console.log(response))
	.catch(err => console.error(err));
