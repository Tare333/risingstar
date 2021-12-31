import React, { useEffect, useState } from 'react';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const currency_symbols = {
  'usd': '$', 
  'eur': '€', 
};

const LOCALE = 'en-US';
const DECIMALS = 0;

const Header = () => {
  return (
    <div><h2>Vincit Rising Star Pre-assignment</h2></div>
  );
}

const DailyValue = ({date, value, prev, currencySymbol}) => {
  let arrow = "";
  let fontColor = "";
  let fvalue = value.toLocaleString(LOCALE, {maximumFractionDigits: DECIMALS});

  if (prev) {
    if (prev < value) {
      arrow = "▲";
      fontColor = "green";
    } else {
      arrow = "▼";
      fontColor = "red";
    }
  }

  return (
    <li>
        {date} - {currencySymbol} {fvalue} <div style={{display: 'inline-block', color: fontColor}}>{arrow}</div>
    </li>  
    );
}

const Content = () => {
  //const [startDate, setStartDate] = useState(new Date(2021, 5, 1));
  //const [endDate, setEndDate] = useState(new Date(2021, 7, 1, 1));
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 3600 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  const [coinId, setCoinId] = useState("bitcoin");
  const [currency, setCurrency] = useState("eur");
  
  const [dataJson, setDataJson] = useState({});
  const [priceData, setPriceData] = useState([]);
  const [bearishTrend, setBearishTrend] = useState(0);
  const [maxTradeVol, setMaxTradeVol] = useState([0, 0]);
  const [maxProfit, setMaxProfit] = useState([0, [0,0]]);

  useEffect(() => {
    if (Object.keys(dataJson).length > 0) {
      dailyPrices();
      maxTradingVolume();
    } 
  }, [dataJson]);

  useEffect(() => {
    longestBearishTrend();
    findMaxProfit();
  }, [priceData]);

  const reduceDays = (obj) => {
    // Reduces data points to a single data point per day if there are multiple
    // Also formats date to yyyy/mm/dd string format
    return obj.reduce((dataObject, dataPoint) => {
      const date = new Date(dataPoint[0]);
      const dateString = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
      if (!(dateString in dataObject)) {
        dataObject[dateString] = dataPoint[1];
      }
      return {...dataObject};
    }, {});
  }

  const dailyPrices = () => {
    const prices = reduceDays(dataJson['prices']);
    const pricesArray = Object.keys(prices).map((d) => [d, prices[d]]);
    //prices are of type: [date string, price as number]
    setPriceData(pricesArray);
  }

  const longestBearishTrend = () => {
    let longest = 0;
    let current = 0;
    for (let i = 1; i < priceData.length; i++) {
      if (priceData[i][1] < priceData[i-1][1]) {
        current++;
        if (current > longest) {
          longest = current;
        }
      } else {
        current = 0;
      }
    }
    setBearishTrend(longest);
  }

  const maxTradingVolume = () => {
    const total_volumes = reduceDays(dataJson['total_volumes']);
    const tradingVolumes = Object.keys(total_volumes).map((d) => [d, total_volumes[d]]);
    let indexOfMaxValue = tradingVolumes.reduce((maxIndex, x, i, array) => x[1] > array[maxIndex][1] ? i : maxIndex, 0);
    //maxTradeVol has type: [date string, trading volume as number]
    setMaxTradeVol(tradingVolumes[indexOfMaxValue]);
  }

  const findMaxProfit = () => {
    if (priceData.length === 0) return;

    let maxP = 0;
    let dateIndices = [0, 0];
    for (let i = 0; i < priceData.length; i++) {
      for (let j = i + 1; j < priceData.length; j++) {
        let p = priceData[j][1] - priceData[i][1];
        if (p > 0 && p > maxP) {
          maxP = p;
          dateIndices = [i, j];
        }
      }
    }
    setMaxProfit([maxP, [priceData[dateIndices[0]], priceData[dateIndices[1]]]]);
  }

  const getStartDate = () => {
    return startDate.getTime() / 1000;
  }

  const getEndDate = () => {
    // adding an extra hour to make sure the end date itself is included in date range
    let extraHour = endDate;
    extraHour.setHours(extraHour.getHours()+1);
    setEndDate(extraHour);
    return endDate.getTime() / 1000;
  }

  const getCoinData = () => {
    const start = getStartDate();
    const end = getEndDate();
    if (start + 23 * 3600 >= end) {
      alert("End date has to be greater than start date");
      return;
    }
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=${currency}&from=${start}&to=${end}`;

    fetch(url)
    .then(response => response.json())
    .then(data => setDataJson(data))
    .catch(error => {
      console.error('Error:', error);
    });
  }

  const toPercentage = (a, b) => {
    // calculates profit divided by price on day bought
    let p = (parseFloat(a) / parseFloat(b) * 100).toFixed(1);
    return p.toString() + '%'
  }

  return (
    <div>
      Coin
      <select defaultValue="bitcoin" onChange={(e) => setCoinId(e.target.value)}>
        <option value="bitcoin">Bitcoin</option>
        <option value="ethereum">Ethereum</option>
      </select>
      
      Currency
      <select defaultValue="eur" onChange={(e) => setCurrency(e.target.value)}>
        <option value="eur">Euro</option>
        <option value="usd">US Dollar</option>
      </select>

      <div>
      <br/>
      Start date
      <DatePicker dateFormat="dd/MM/yyyy" selected={startDate} onChange={(date) => date < Date.now() - 24 * 3600 ? setStartDate(date) : alert("Choose earlier start date")} />
      </div>

      <div>
      End date 
      <DatePicker dateFormat="dd/MM/yyyy" selected={endDate} onChange={(date) => setEndDate(date)} />
      </div>

      <br/>

      <div><button onClick={() => getCoinData()}> Fetch data </button></div>

      <br/>

      {Object.keys(dataJson).length > 0 && <div>
      <div>Longest bearish trend: {bearishTrend} days</div>
      <div>Maximum trading volume {maxTradeVol[1].toLocaleString(LOCALE, {maximumFractionDigits: DECIMALS})} {currency_symbols[currency]} occured on date {maxTradeVol[0]}</div>
      {maxProfit[0] > 0 ?
      <div>Maximum profit of {maxProfit[0].toLocaleString(LOCALE, {maximumFractionDigits: DECIMALS})} {currency_symbols[currency]} per coin or {toPercentage(maxProfit[0], maxProfit[1][0][1])} obtainable by buying in {maxProfit[1][0][0]} and selling in {maxProfit[1][1][0]}</div>
      : <div>No profits available on given date range</div>
      }
      </div>
      }

      <br/>

      {priceData.map((d, i) => <DailyValue key={d[0]} date={d[0]} value={d[1]} prev={i > 0 ? priceData[i-1][1] : null} currencySymbol={currency_symbols[currency]} />)}

    </div>
    );
}

const App = () => {

  return (
    <div>
    <Header />
    <Content />
    </div>
  )
}

export default App