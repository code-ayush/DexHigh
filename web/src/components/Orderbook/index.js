import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import "./styles.scss";

const OrderBook = () => {
  const [orderBook, setOrderBook] = useState({ bids: {}, asks: {} });
  const [realTime, setRealTime] = useState(false);
  const [filter, setFilter] = useState("ALL");
  useEffect(() => {
    const subscribe = {
      event: "subscribe",
      channel: "book",
      symbol: "tBTCUSD",
    };
    const ws = new WebSocket("wss://api-pub.bitfinex.com/ws/2");

    ws.onopen = () => {
      ws.send(JSON.stringify(subscribe));
      setRealTime(true);
    };
    ws.onmessage = function (msg) {
      let data = JSON.parse(msg.data)[1];
      if (data && data.length === 3) {
        let raw = { price: data[0], cnt: data[1], amount: data[2] };
        let side = raw.amount >= 0 ? "bids" : "asks";
        raw.amount = Math.abs(raw.amount);
        setOrderBook((prev) => {
          const book = { ...prev };
          var min = Math.min(...Object.keys(book[side]));
          if (raw.price > min) {
            delete book[side][raw.price];
          }
          if (raw.cnt === 0) {
            delete book[side][raw.price];
          } else {
            book[side][raw.price] = raw;
          }
          return book;
        });
      }
    };
    ws.onclose = () => {
      ws.close();
      setRealTime(false);
    };

    return () => {
      ws.close();
      setRealTime(false);
    };
  }, []);

  return (
    <div className="orderbook flex-column flex-1" style={{ overflow: "auto" }}>
      <div>
        <button
          className={filter === "ALL" ? "buttonActive" : "button"}
          onClick={() => setFilter("ALL")}
        >
          ALL
        </button>
        <button
          className={filter === "BUY" ? "buttonActive" : "button"}
          onClick={() => setFilter("BUY")}
        >
          BUY
        </button>
        <button
          className={filter === "SELL" ? "buttonActive" : "button"}
          onClick={() => setFilter("SELL")}
        >
          SELL
        </button>
      </div>
      <div className="flex header text-secondary">
        <div className="col-4 text-left">Amount</div>
        <div className="col-4 text-left">Price</div>
        <div className="col-4 text-left">Total</div>
      </div>
      <div
        className="flex-column flex-1"
        style={{ height: "100%", overflow: "auto" }}
      >
        {filter === "SELL" && (
          <div className="status border-top border-bottom">
            {realTime ? (
              <div className="col-6 text-success">
                <i className="fa fa-circle" aria-hidden="true" /> RealTime
                {orderBook.asks && orderBook.bids
                  ? " - " +
                    Math.min(
                      Object.keys(orderBook.asks).slice(-1)[0],
                      Object.keys(orderBook.bids)[0]
                    )
                  : ""}
              </div>
            ) : (
              <div className="col-6 text-danger">
                <i className="fa fa-circle" aria-hidden="true" /> Disconnected
              </div>
            )}
          </div>
        )}
        {filter !== "BUY" && (
          <div
            className="asks flex-column flex-column-reverse flex-1 overflow-hidden"
            style={{ justifyContent: "flex-end" }}
          >
            {Object.keys(orderBook.asks)
              .slice(0, 15)
              .map((item) => {
                return (
                  <div
                    className="ask flex align-items-center"
                    key={orderBook.asks[item].price.toString()}
                  >
                    <div
                      className="askBar"
                      style={{ width: `${100 / orderBook.asks[item].cnt}%` }}
                    ></div>

                    <div className="col-4 orderbook-amount text-left">
                      {orderBook.asks[item].amount}
                    </div>
                    <div className="col-4 text-success text-left">
                      {orderBook.asks[item].price}
                    </div>
                    <div className="col-4 text-left">
                      {(
                        orderBook.asks[item].price * orderBook.asks[item].amount
                      ).toFixed(2)}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        {filter !== "SELL" && (
          <>
            <div className="status border-top border-bottom">
              {realTime ? (
                <div className="col-6 text-success">
                  <i className="fa fa-circle" aria-hidden="true" /> RealTime
                  {orderBook.asks && orderBook.bids
                    ? " - " +
                      Math.min(
                        Object.keys(orderBook.asks).slice(-1)[0],
                        Object.keys(orderBook.bids)[0]
                      )
                    : ""}
                </div>
              ) : (
                <div className="col-6 text-danger">
                  <i className="fa fa-circle" aria-hidden="true" /> Disconnected
                </div>
              )}
            </div>
            <div className="bids flex-column flex-1 overflow-hidden">
              {Object.keys(orderBook.bids)
                .slice(0, 15)
                .map((item) => {
                  return (
                    <div
                      className="ask flex align-items-center"
                      key={orderBook.bids[item].price.toString()}
                    >
                      <div
                        className="bidBar"
                        style={{ width: `${100 / orderBook.bids[item].cnt}%` }}
                      ></div>
                      <div className="col-4 orderbook-amount text-left">
                        {orderBook.bids[item].amount}
                      </div>
                      <div className="col-4 text-danger text-left">
                        {orderBook.bids[item].price}
                      </div>{" "}
                      <div className="col-4 text-left">
                        {(
                          orderBook.bids[item].price *
                          orderBook.bids[item].amount
                        ).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    asks: state.market.getIn(["orderbook", "asks"]),
    bids: state.market.getIn(["orderbook", "bids"]),
    loading: false,
    currentMarket: state.market.getIn(["markets", "currentMarket"]),
    websocketConnected: state.config.get("websocketConnected"),
    theme: state.config.get("theme"),
  };
};

export default connect(mapStateToProps)(OrderBook);
