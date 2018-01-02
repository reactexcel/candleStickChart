import React, { Component } from 'react';
import { render } from 'react-dom';
import Chart from './Chart';
import PropTypes from 'prop-types';
import { getData } from './utils';
import { TypeChooser } from 'react-stockcharts/lib/helper';

import './App.css';
import $ from 'jquery';
var moment = require('moment');

class App extends Component {
  constructor(props) {
    super(props);
    let endDate = moment().format();
    let startDate = moment()
      .subtract(5, 'h')
      .format();
    console.log(endDate, 'endDate');
    console.log(startDate, 'startDate');
    this.state = {
      endDate: endDate,
      startDate: startDate,
      currentSelectCurrency: 0,
    };
  }
  componentDidMount() {
    // getData().then(data => {
    // 	this.setState({ data })
    // })
    let self = this;
    setInterval(function() {
      let endDate = moment().format();
      console.log(self.state.startDate, 'startDate');
      console.log(endDate, 'endDate');
      self.getCurrency(
        self.state.startDate,
        endDate,
        self.state.currentSelectCurrency
      );
    }, 60000);
    self.getCurrency(
      this.state.startDate,
      this.state.endDate,
      this.state.currentSelectCurrency
    );
  }

  getCurrency(startDate, endDate, currentSelectCurrency) {
    let currency_In_Url;
    if (currentSelectCurrency == 0) {
      currency_In_Url = 'get_btc/';
    } else if (currentSelectCurrency == 1) {
      currency_In_Url = 'get_eth/';
    } else if (currentSelectCurrency == 2) {
      currency_In_Url = 'get_xrp/';
    } else if (currentSelectCurrency == 3) {
      currency_In_Url = 'get_ltc/';
    } else if (currentSelectCurrency == 4) {
      currency_In_Url = 'get_bch/';
    }
    let self = this;
    let url =
      'http://5.9.144.226:6001/' + currency_In_Url + startDate + '/' + endDate;
    $.ajax({
      url: url,
      type: 'GET',
      success: function(response) {
        if (response.data) {
          let data = response.data;
          if (data) {
            let a = self.getActualData(data, self.state.currentSelectCurrency);
            self.setState({
              actualData: a,
              data: data,
            });
          }
        }
      },
    });
  }
  getActualData(data, curr) {
    console.log(data, 'data');
    console.log(curr, 'currency');
    let currencyType = 'BTC';
    if (curr == 0) {
      currencyType = 'BTC';
    } else if (curr == 1) {
      currencyType = 'ETH';
    } else if (curr == 2) {
      currencyType = 'XRP';
    } else if (curr == 3) {
      currencyType = 'LTC';
    } else if (curr == 4) {
      currencyType = 'BCH';
    }
    let actualData = [];
    $.map(data, function(d, i) {
      //if(i<2){
      //let calculated = d.calculated[0]
      actualData.push({
        absoluteChange: undefined,
        close: d.close,
        date: new Date(d.date),
        dividend: '',
        high: d.high,
        low: d.low,
        open: d.open,
        percentChange: undefined,
        split: '',
        volume: d.volume,
        currency: d[currencyType],
        currencyType: curr,
        // absoluteChange:undefined,
        // close: calculated.price[curr]['close'],
        // date: new Date(calculated.date),
        // dividend:"",
        // high: calculated.price[curr]['high'],
        // low: calculated.price[curr]['low'],
        // open: calculated.price[curr]['open'],
        // percentChange:undefined,
        // split:"",
        // volume: calculated.price[curr]['volume'],
        // currency: calculated.price[curr][currencyType],
        // currencyType:curr
      });
      //}
    });
    console.log(actualData, 'actualData');
    return actualData;
  }
  render() {
    //  if (this.state == null) {
    // 	return <div>Loading...</div>
    // }
    //console.log(this.state.data,"render");
    let actualData =
      this.state && this.state.actualData && this.state.actualData.length
        ? this.state.actualData
        : [];
    if (this.state.actualData == null) {
      return <div>Loading...</div>;
    }
    console.log(this.state.actualData, 'render');
    return (
      <div className="App">
        <div className="row" style={{ textAlign: 'left' }}>
          <div
            className="col-sm-12"
            style={{ padding: '5px', fontSize: '30px', textAlign: 'center' }}
          >
            <span>Currency Chart</span>
          </div>
          <div
            className="col-sm-3"
            style={{
              display: 'inlineBlock',
              padding: '5px',
              backgroundColor: '#c4c4c0',
            }}
          >
            <label>Select Currency: </label>
            <select
              id="currency"
              onChange={e => {
                let val = parseInt($('#currency option:selected').val());
                this.setState({
                  currentSelectCurrency: val,
                });
                let endDate = moment().format();
                let actData = this.getCurrency(
                  this.state.startDate,
                  endDate,
                  val
                );
                // this.setState({
                // 	'actualData':actData,
                // })
              }}
              value={this.state.currentSelectCurrency}
              style={{ marginLeft: '10px' }}
            >
              <option value="0">BitCoins (BTC)</option>
              <option value="1">Ethereum (ETH)</option>
              <option value="2">Ripple (XRP)</option>
              <option value="3">Litecoin (LTC)</option>
              <option value="4">Bitcoin Cash (BCH)</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <Chart type={'canvas'} data={actualData} />
            {/* <Chart type={'canvas'} data={this.state.data} /> */}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
