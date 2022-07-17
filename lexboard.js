// 使用 d3 创建有限的 board
const approximatelyEqual = (v1, v2, epsilon = 0.001) =>
  Math.abs(v1 - v2) < epsilon
class LeXBoard {
  constructor({ unit = 20, layers } = {}) {
    this.unit = unit
    this.renderBG()
    this.onZoom()
    this.onResize()
    this.layers = []
    if (Array.isArray(layers) && layers.length) {
      for (let i = 0; i < layers.length; i++) {
        let layer = layers[i]
        this.layers.push({ el: this.renderLayer(layer.type), type: layer.type })
      }
    }
  }

  renderLayer(type) {
    if (type === 'svg') {
      return this.bg.append('g')
    } else {
      return d3
        .select(document.body)
        .append('div')
        .style('position', 'absolute')
        .style('top', 0)
        .style('left', 0)
    }
  }
  renderBG() {
    let unit = this.unit
    let svg = d3
      .select(document.body)
      .append('svg')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('cursor', 'move')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
    this.bg = svg
    // 加入坐标系
    let xScale = d3.scaleLinear().domain([0, innerWidth]).range([0, innerWidth])
    let xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.floor(innerWidth / unit))
      .tickSize(2 * innerHeight)
      .tickPadding(8 - 2 * innerHeight)
    let yScale = d3
      .scaleLinear()
      .domain([0, innerHeight])
      .range([0, innerHeight])

    let yAxis = d3
      .axisRight(yScale)
      .ticks(Math.floor(innerHeight / unit))
      .tickSize(2 * innerWidth)
      .tickPadding(8 - 2 * innerWidth)

    let gY = svg.append('g').attr('class', 'axis y').call(yAxis)
    let gX = svg.append('g').attr('class', 'axis x').call(xAxis)

    d3.selectAll('g.tick')
      .filter((d) => d % (5 * unit) === 0)
      .select('line')
      .attr('class', 'dark')

    d3.selectAll('g.tick')
      .filter((d) => d % (5 * unit) !== 0)
      .select('text')
      .style('opacity', 0)

    this.xScale = xScale
    this.yScale = yScale
    this.xAxis = xAxis
    this.yAxis = yAxis
    this.xAxisEl = gX
    this.yAxisEl = gY
  }
  get scale() {
    let { k } = this.zoomTransform
    if (k < 2 && k > 0.5) {
      return 1
    } else if (k >= 2 && k < 4) {
      return 2
    } else if (k >= 4 && k < 8) {
      return 4
    } else if (k > 0.25 && k <= 0.5) {
      return 0.5
    } else if (k > 0.125 && k <= 0.25) {
      return 0.25
    } else if (k === 0.125) {
      return 0.125
    }
  }
  get zoomTransform() {
    return d3.zoomTransform(this.bg.node())
  }
  onZoom() {
    const zoom = d3
      .zoom()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .scaleExtent([0.125, 6])
      .on('zoom', (e) => {
        if (e.sourceEvent.target !== this.bg.node()) return
        // 近似相等

        let { xAxisEl, yAxisEl, xScale, yScale, xAxis, yAxis, unit } = this
        let { x, y, k } = e.transform
        let newXScale = e.transform.rescaleX(xScale)
        let newYScale = e.transform.rescaleY(yScale)

        xAxisEl.call(xAxis.scale(newXScale))
        yAxisEl.call(yAxis.scale(newYScale))
        this.layers.forEach((layer) => {
          console.log(layer)
          if (layer.type === 'svg') {
            layer.el.attr('transform', e.transform)
          } else {
            layer.el.style('transform', `translate(${x}px,${y}px) scale(${k})`)
          }
        })
        d3.selectAll('g.tick')
          .filter((d) => approximatelyEqual(d % ((5 * unit) / this.scale), 0))
          .select('line')
          .attr('class', 'dark')

        d3.selectAll('g.tick')
          .filter((d) => !approximatelyEqual(d % ((5 * unit) / this.scale), 0))
          // .filter((d) => d % ((5 * unit) / editor.bg.scale) !== 0)
          .select('line')
          .attr('class', '')

        d3.selectAll('g.tick')

          .filter((d) => !approximatelyEqual(d % ((5 * unit) / this.scale), 0))
          .select('text')
          .style('opacity', 0)

        d3.selectAll('g.tick')

          .filter((d) => approximatelyEqual(d % ((5 * unit) / this.scale), 0))
          .select('text')
          .style('opacity', 0.5)
      })
    this.bg.call(zoom)
  }

  onResize() {
    const resize = () => {
      let { bg, xAxisEl, yAxisEl, unit } = this
      bg.attr('width', innerWidth).attr('height', innerHeight)
      let xScale = d3
        .scaleLinear()
        .domain([0, innerWidth])
        .range([0, innerWidth])
      this.xScale = xScale
      this.xAxis = d3
        .axisBottom(xScale)
        .ticks(Math.floor(innerWidth / unit))
        .tickSize(2 * innerHeight)
        .tickPadding(8 - 2 * innerHeight)

      let yScale = d3
        .scaleLinear()
        .domain([0, innerHeight])
        .range([0, innerHeight])
      this.yScale = yScale
      this.yAxis = d3
        .axisRight(yScale)
        .ticks(Math.floor(innerHeight / unit))
        .tickSize(2 * innerWidth)
        .tickPadding(8 - 2 * innerWidth)

      yAxisEl.call(this.yAxis)
      xAxisEl.call(this.xAxis)
      d3.selectAll('g.tick')
        .filter((d) => approximatelyEqual(d % (5 * unit), 0))
        .select('line')
        .attr('class', 'dark')

      d3.selectAll('g.tick')
        .filter((d) => !approximatelyEqual(d % (5 * unit), 0))
        .select('text')
        .style('opacity', 0)
    }

    window.onresize = resize
  }
}
