import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';

import { ChartCanvas, Chart } from 'react-stockcharts';
import {
  BarSeries,
  CandlestickSeries,
  LineSeries,
  MACDSeries,
  RSISeries,
} from 'react-stockcharts/lib/series';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
import {
  CrossHairCursor,
  EdgeIndicator,
  CurrentCoordinate,
  MouseCoordinateX,
  MouseCoordinateY,
} from 'react-stockcharts/lib/coordinates';

import { discontinuousTimeScaleProvider } from 'react-stockcharts/lib/scale';
import {
  OHLCTooltip,
  MovingAverageTooltip,
  MACDTooltip,
  HoverTooltip,
  RSITooltip,
  SingleValueTooltip,
} from 'react-stockcharts/lib/tooltip';
import { ema, sma, macd, rsi, atr } from 'react-stockcharts/lib/indicator';
import { fitWidth } from 'react-stockcharts/lib/helper';
import {
  TrendLine,
  FibonacciRetracement,
  DrawingObjectSelector,
} from 'react-stockcharts/lib/interactive';
import { last, toObject } from 'react-stockcharts/lib/utils';

import { saveInteractiveNodes, getInteractiveNodes } from './interactiveutils';

function getMaxUndefined(calculators) {
  return calculators
    .map(each => each.undefinedLength())
    .reduce((a, b) => Math.max(a, b));
}
const LENGTH_TO_SHOW = 180;
const dateFormat = timeFormat('%Y-%m-%d');
const numberFormat = format('.2f');

const macdAppearance = {
  stroke: {
    macd: '#FF0000',
    signal: '#00F300',
  },
  fill: {
    divergence: '#4682B4',
  },
};

class CandlestickChart extends React.Component {
  constructor(props) {
    super(props);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onDrawCompleteChart1 = this.onDrawCompleteChart1.bind(this);
    this.onDrawCompleteChart3 = this.onDrawCompleteChart3.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
    this.onFibComplete1 = this.onFibComplete1.bind(this);
    this.saveInteractiveNodes = saveInteractiveNodes.bind(this);
    this.getInteractiveNodes = getInteractiveNodes.bind(this);

    this.saveCanvasNode = this.saveCanvasNode.bind(this);
    this.tooltipContent = this.tooltipContent.bind(this);
    this.handleDownloadMore = this.handleDownloadMore.bind(this);
    this.state = {
      enableTrendLine: false,
      trends_1: [
        {
          start: [1606, 56],
          end: [1711, 53],
          appearance: { stroke: 'green' },
          type: 'XLINE',
        },
      ],
      trends_3: [],
      enableFib: true,
      retracements_1: [],
      retracements_3: [],
    };
  }
  saveCanvasNode(node) {
    this.canvasNode = node;
  }
  componentDidMount() {
    document.addEventListener('keyup', this.onKeyPress);
    $('svg').css('margin-left', '-650px');
    $('svg').css('width', '100%');
    $('.react-stockchart').css('background-color', '#303030');
    $('svg').css('background-color', 'transparent');
  }
  componentWillUnmount() {
    document.removeEventListener('keyup', this.onKeyPress);
  }
  handleSelection(interactives) {
    const state = toObject(interactives, each => {
      return [`trends_${each.chartId}`, each.objects];
    });
    this.setState(state);
  }
  onFibComplete1(retracements_1) {
    this.setState({
      retracements_1,
      enableFib: false,
    });
  }
  onFibComplete3(retracements_3) {
    this.setState({
      retracements_3,
      enableFib: false,
    });
  }
  onDrawCompleteChart1(trends_1) {
    // this gets called on
    // 1. draw complete of trendline
    // 2. drag complete of trendline
    console.log(trends_1);
    this.setState({
      enableTrendLine: false,
      trends_1,
    });
  }
  onDrawCompleteChart3(trends_3) {
    // this gets called on
    // 1. draw complete of trendline
    // 2. drag complete of trendline
    console.log(trends_3);
    this.setState({
      enableTrendLine: false,
      trends_3,
    });
  }
  onKeyPress(e) {
    const keyCode = e.which;
    console.log(keyCode);
    switch (keyCode) {
      case 46: {
        // DEL
        const retracements_1 = this.state.retracements_1.filter(
          each => !each.selected
        );
        const retracements_3 = this.state.retracements_3.filter(
          each => !each.selected
        );
        const trends_1 = this.state.trends_1.filter(each => !each.selected);
        const trends_3 = this.state.trends_3.filter(each => !each.selected);

        this.canvasNode.cancelDrag();
        this.setState({
          trends_1,
          trends_3,
          retracements_1,
          retracements_3,
        });
        break;
      }
      case 27: {
        // ESC
        this.node_1.terminate();
        this.node_3.terminate();
        this.canvasNode.cancelDrag();
        this.setState({
          enableTrendLine: false,
          enableFib: false,
        });
        break;
      }
      case 68: // D - Draw trendline
      case 69: {
        // E - Enable trendline
        this.setState({
          enableTrendLine: true,
          enableFib: false,
        });
        break;
      }
    }
  }
  handleDownloadMore(start, end) {
    console.log(start, 'start');
    console.log(end, 'end');
  }
  tooltipContent(ys) {
    return ({ currentItem, xAccessor }) => {
      return {
        x: dateFormat(xAccessor(currentItem)),
        y: [
          {
            label: 'open',
            value: currentItem.open && numberFormat(currentItem.open),
          },
          {
            label: 'high',
            value: currentItem.high && numberFormat(currentItem.high),
          },
          {
            label: 'low',
            value: currentItem.low && numberFormat(currentItem.low),
          },
          {
            label: 'close',
            value: currentItem.close && numberFormat(currentItem.close),
          },
        ]
          .concat(
            ys.map(each => ({
              label: each.label,
              value: each.value(currentItem),
              stroke: each.stroke,
            }))
          )
          .filter(line => line.value),
      };
    };
  }
  render() {
    const ema26 = ema()
      .id(0)
      .options({ windowSize: 26 })
      .merge((d, c) => {
        d.ema26 = c;
      })
      .accessor(d => d.ema26);

    const ema12 = ema()
      .id(1)
      .options({ windowSize: 12 })
      .merge((d, c) => {
        d.ema12 = c;
      })
      .accessor(d => d.ema12);

    const ema20 = ema()
      .id(0)
      .options({ windowSize: 20 })
      .merge((d, c) => {
        d.ema20 = c;
      })
      .accessor(d => d.ema20);

    const ema50 = ema()
      .id(2)
      .options({ windowSize: 50 })
      .merge((d, c) => {
        d.ema50 = c;
      })
      .accessor(d => d.ema50);
    // const smaVolume50 = sma()
    // 	.id(3)
    // 	.options({
    // 		windowSize: 50,
    // 		sourcePath: "volume",
    // 	})
    // 	.merge((d, c) => {d.smaVolume50 = c;})
    // 	.accessor(d => d.smaVolume50);

    const rsiCalculator = rsi()
      .options({ windowSize: 14 })
      .merge((d, c) => {
        d.rsi = c;
      })
      .accessor(d => d.rsi);
    const atr14 = atr()
      .options({ windowSize: 14 })
      .merge((d, c) => {
        d.atr14 = c;
      })
      .accessor(d => d.atr14);

    const macdCalculator = macd()
      .options({
        fast: 12,
        slow: 26,
        signal: 9,
      })
      .merge((d, c) => {
        d.macd = c;
      })
      .accessor(d => d.macd);

    const { type, data: initialData, width, ratio } = this.props;

    //const calculatedData = macdCalculator(ema12(ema26(initialData)));
    //const calculatedData = ema26(ema12(smaVolume50(rsiCalculator(atr14(initialData)))));
    const calculatedData = ema26(
      ema12(macdCalculator(rsiCalculator(atr14(initialData))))
    );
    const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(
      d => d.date
    );
    const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(
      calculatedData
    );

    const start = xAccessor(last(data));
    const end = xAccessor(data[Math.max(0, data.length - 150)]);
    const xExtents = [start, end];
    const height = 600;

    var margin = { left: 70, right: 70, top: 20, bottom: 30 };
    var gridHeight = height - margin.top - margin.bottom;
    var gridWidth = width - margin.left - margin.right;
    var showGrid = true;
    var yGrid = showGrid
      ? {
          innerTickSize: -1 * gridWidth,
          tickStrokeDasharray: 'Solid',
          tickStrokeOpacity: 0.3,
          tickStrokeWidth: 1,
        }
      : {};
    var xGrid = showGrid
      ? {
          innerTickSize: -1 * gridHeight,
          tickStrokeDasharray: 'Solid',
          tickStrokeOpacity: 0.3,
          tickStrokeWidth: 1,
        }
      : {};
    return (
      <ChartCanvas
        ref={this.saveCanvasNode}
        height={600}
        width={width}
        ratio={ratio}
        margin={{ left: 70, right: 70, top: 20, bottom: 30 }}
        type={type}
        seriesName="MSFT"
        data={data}
        xScale={xScale}
        xAccessor={xAccessor}
        displayXAccessor={displayXAccessor}
        onLoadMore={this.handleDownloadMore}
        //xExtents={xExtents}
      >
        <Chart
          id={1}
          height={250}
          yExtents={[d => [d.high, d.low], ema26.accessor(), ema12.accessor()]}
          padding={{ top: 10, bottom: 20 }}
        >
          <XAxis
            axisAt="bottom"
            orient="bottom"
            showTicks={false}
            outerTickSize={0}
            {...xGrid}
          />
          <YAxis axisAt="right" orient="right" ticks={5} {...yGrid} />
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format('.2f')}
          />

          <CandlestickSeries />
          <LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()} />
          <LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()} />

          <CurrentCoordinate
            yAccessor={ema26.accessor()}
            fill={ema26.stroke()}
          />
          <CurrentCoordinate
            yAccessor={ema12.accessor()}
            fill={ema12.stroke()}
          />

          <EdgeIndicator
            itemType="last"
            orient="right"
            edgeAt="right"
            yAccessor={d => d.close}
            fill={d => (d.close > d.open ? '#6BA583' : '#FF0000')}
          />

          <OHLCTooltip origin={[-40, 0]} />

          {/*<MovingAverageTooltip
						onClick={e => console.log(e)}
						origin={[-38, 15]}
						options={[
							{
								yAccessor: ema26.accessor(),
								type: ema26.type(),
								stroke: ema26.stroke(),
								windowSize: ema26.options().windowSize,
							},
							{
								yAccessor: ema12.accessor(),
								type: ema12.type(),
								stroke: ema12.stroke(),
								windowSize: ema12.options().windowSize,
							},
						]}
					/>*/}
          <TrendLine
            ref={this.saveInteractiveNodes('Trendline', 1)}
            enabled={this.state.enableTrendLine}
            type="RAY"
            snap={false}
            snapTo={d => [d.high, d.low]}
            onStart={() => console.log('START')}
            onComplete={this.onDrawCompleteChart1}
            trends={this.state.trends_1}
          />
          <HoverTooltip
            yAccessor={ema50.accessor()}
            tooltipContent={this.tooltipContent([
              {
                label: `${ema20.type()}(${ema20.options().windowSize})`,
                value: d => numberFormat(ema20.accessor()(d)),
                stroke: ema20.stroke(),
              },
              {
                label: `${ema50.type()}(${ema50.options().windowSize})`,
                value: d => numberFormat(ema50.accessor()(d)),
                stroke: ema50.stroke(),
              },
            ])}
            fontSize={15}
          />
          <FibonacciRetracement
            ref={this.saveInteractiveNodes('FibonacciRetracement', 1)}
            enabled={this.state.enableFib}
            retracements={this.state.retracements_1}
            onComplete={this.onFibComplete1}
          />
        </Chart>
        <Chart
          id={2}
          height={100}
          yExtents={[d => d.volume]}
          origin={(w, h) => [0, h - 300]}
        >
          <YAxis
            axisAt="left"
            orient="left"
            ticks={5}
            tickFormat={format('.2s')}
          />

          <MouseCoordinateY
            at="left"
            orient="left"
            displayFormat={format('.4s')}
          />

          <BarSeries
            yAccessor={d => d.volume}
            fill={d => (d.close > d.open ? '#6BA583' : '#FF0000')}
          />
        </Chart>
        <Chart
          id={3}
          height={120}
          yExtents={macdCalculator.accessor()}
          origin={(w, h) => [0, h - 200]}
          padding={{ top: 10, bottom: 10 }}
        >
          <XAxis axisAt="bottom" orient="bottom" {...xGrid} />
          <YAxis axisAt="right" orient="right" ticks={2} />

          <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat('%Y-%m-%d %H:%M')}
          />
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format('.2f')}
          />
          <TrendLine
            ref={this.saveInteractiveNodes('Trendline', 3)}
            enabled={this.state.enableTrendLine}
            type="RAY"
            snap={false}
            snapTo={d => [d.high, d.low]}
            onStart={() => console.log('START')}
            onComplete={this.onDrawCompleteChart3}
            trends={this.state.trends_3}
          />
          <MACDSeries yAccessor={d => d.macd} {...macdAppearance} />
          <MACDTooltip
            origin={[-38, 15]}
            yAccessor={d => d.macd}
            options={macdCalculator.options()}
            appearance={macdAppearance}
          />
        </Chart>
        <Chart
          id={8}
          yExtents={[0, 100]}
          height={90}
          origin={(w, h) => [0, h - 90]}
        >
          <XAxis axisAt="bottom" orient="bottom" {...xGrid} />
          <YAxis axisAt="right" orient="right" tickValues={[30, 50, 70]} />
          <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat('%Y-%m-%d %H:%M')}
          />
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format('.2f')}
          />

          <RSISeries yAccessor={d => d.rsi} />

          <RSITooltip
            origin={[-38, 15]}
            yAccessor={d => d.rsi}
            options={rsiCalculator.options()}
          />
        </Chart>
        <CrossHairCursor />
        <DrawingObjectSelector
          enabled={!this.state.enableTrendLine}
          getInteractiveNodes={this.getInteractiveNodes}
          drawingObjectMap={{
            Trendline: 'trends',
          }}
          onSelect={this.handleSelection}
        />
      </ChartCanvas>
    );
  }
}

CandlestickChart.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['svg', 'hybrid']).isRequired,
};

CandlestickChart.defaultProps = {
  type: 'svg',
};

const CandleStickChartWithInteractiveIndicator = fitWidth(CandlestickChart);

export default CandleStickChartWithInteractiveIndicator;
