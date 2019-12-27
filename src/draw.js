// spray additional data into the global name space
let tarotData = {};
let tarotDataLoaded = false;
fetch('./data/tarot-data.json')
  .then(d => d.json())
  .then(d => {
    dataLoaded = true;
    tarotData = d;
  });

/**
 * draws the empty card spaces, including the tooltips
 *
 * container - the d3 selection for the full container pane
 * positions - an array of objects describing the positioning and metadata with the card spaces
 * scales - an object of scales
 */
function drawCardSpaces(container, positions, scales) {
  const {xWindow, yWindow} = scales;
  const {h, w} = getCardHeightWidth();

  const containers = container.selectAll('.cardspacecontainer').data(positions);
  const cardContainers = containers
    .enter()
    .append('div')
    .style('transform', d => `translate(${xWindow(d.x)}px, ${yWindow(d.y)}px)`)
    .attr('class', 'cardcontainer');
  const cardSpace = cardContainers
    .append('div')
    .attr('class', 'cardspacecontainer');

  cardSpace
    .append('div')
    .attr('class', 'cardspace')
    // TODO this is wrong and doesnt handle the sideways one right
    .style(
      'transform',
      d =>
        (d.rotate &&
          `translate(${-xWindow(w) / 2}, ${yWindow(w)}) rotate(-90)`) ||
        `translate(${xWindow(w) * 0.05}, ${yWindow(h) * 0.05})`
    )
    .style('width', d => {
      console.log(d, xWindow(w) * 0.95, `${xWindow(w) * 0.95}px`);
      return `${xWindow(w) * 0.95}px`;
    })
    .style('height', `${yWindow(h) * 0.95}px`)
    .style('fill', '#333');

  cardSpace
    .append('div')
    .attr('class', 'cardspace-title')
    // .attr('x', xWindow(w / 2))
    // .attr('y', yWindow(h / 2))
    .attr('text-anchor', 'middle')
    .text(d => d.label);

  // const TOOLTIP_WIDTH = 200;
  // const TOOLTIP_HEIGHT = 100;
  // const toolTipContainer = cardSpace
  //   .append('div')
  //   .attr('class', 'tooltip-container')
  //   .attr(
  //     'transform',
  //     `translate(${xWindow(w / 2) - TOOLTIP_WIDTH / 2}, ${yWindow(h) -
  //       TOOLTIP_HEIGHT / 2})`
  //   );
  // toolTipContainer
  //   .append('foreignObject')
  //   .attr('class', 'tooltip')
  //   .attr('x', 0)
  //   .attr('y', 0)
  //   .attr('height', TOOLTIP_HEIGHT)
  //   .attr('width', TOOLTIP_WIDTH)
  //   .html(d => `<div class="tooltip">${tarotData.layouts[d.label]}</div>`);
}

// UNUSED IN REFACTOR
// function drawSidebar(container, scales) {
//   const {xWindow, yWindow} = scales;
//   container
//     .append('rect')
//     .attr('x', xWindow(0.9))
//     .attr('y', yWindow(0))
//     .attr('height', yWindow(1))
//     .attr('width', xWindow(1.2) - xWindow(0.9))
//     .attr('fill', 'lightgray');
//
//   container
//     .append('foreignObject')
//     .attr(
//       'transform',
//       () => `translate(${xWindow(0.95)},${yWindow(0.6) - 100})`
//     )
//     .attr('width', 200)
//     .attr('height', 100)
//     .append('xhtml:div')
//     .html('Click the deck to draw a card');
// }

/**
 * draws the cards themselves, also contains state relevant to how many cards have been drawn
 *
 * container - the d3 selection for the full container pane
 * cards - an array of object with each individual card data
 * scales - an object of scales
 * positions - an array of objects describing the positioning and metadata with the card spaces
 */
function drawCards(container, cards, scales, positions) {
  const {h, w} = getCardHeightWidth();
  const {xWindow, yWindow} = scales;
  // stateful incrementer of how deep into the draw we are, as the user draws more cards we increment this idx
  let nextCardIdx = 0;
  // the function governing the interaction with the card
  // card - an object describing a card
  function onCardClick(card) {
    const nextCardPos = positions[nextCardIdx];
    if (!nextCardPos) {
      return;
    }
    console.log(card);
    renderAppropriateCard(this, card, scales);
    d3.select(this)
      .transition(t)
      .style('left', null)
      .style('bottom', null)
      .style('transform', () => {
        const xPos = xWindow(nextCardPos.x);
        const yPos = yWindow(nextCardPos.y);
        if (!nextCardPos.rotate) {
          return `translate(${xPos}px,${yPos}px)`;
        }
        return `translate(${xPos - 0.5 * xWindow(w)}px,${yPos +
          xWindow(w) * 1.12}px) rotate(-90)`;
      });
    nextCardIdx += 1;
  }

  // give the cards initial positioning to make it look like are in a pile
  cards.forEach((card, idx) => {
    // card.x = 0.95 + (idx / 81) * 0.03;
    // card.y = 0.6 + (idx / 81) * 0.03;
    card.x = idx;
    card.y = idx;
  });

  // our transition for drawing cards
  const t = d3
    .transition()
    .duration(750)
    .ease(d3.easeLinear);

  // the draw code
  const cardJoin = container.selectAll('.card').data(cards, d => `${d.index}`);
  // card container
  const card = cardJoin
    .enter()
    .append('div')
    .attr('class', 'card')
    .style('left', '-275px')
    .style('bottom', '20%')
    .style('transform', d => `translate(${d.x}px,${d.y}px)`)
    .on('click', onCardClick);
  cardJoin.exit().remove();

  card
    .append('div')
    .attr('class', 'card-back')
    // .attr('x', 0)
    // .attr('y', 0)
    .style('height', `${yWindow(h)}px`)
    .style('width', `${xWindow(w)}px`)
    .append('img')
    .attr('src', './assets/card-back.png');
}

/**
 * The one card layout.
 * Works the same as the three card with two cards that are never drawn
 * container - the d3 selection for the full container pane
 */
function oneCard(container) {
  // TODO select what we want EXAMPLE to be instead
  const labels = ['*', 'EXAMPLE', '*'];
  const scales = makeScales(container, labels);
  return {
    scales,
    positions: [{x: scales.xScale('EXAMPLE'), y: 0.4, label: 'EXAMPLE'}]
  };
}

/**
 * The three card layout
 * container - the d3 selection for the full container pane
 */
function threeCard(container) {
  const labels = ['Background', 'Problem', 'Advice'];
  const scales = makeScales(container, labels);
  return {
    scales,
    positions: labels.map(label => ({x: scales.xScale(label), y: 0.4, label}))
  };
}

/**
 * The celtic cross layout
 * container - the d3 selection for the full container pane
 */
function celticCross(container) {
  const positions = [
    {x: 1, y: 1.9, label: 'Challenges', rotate: true},
    {x: 1, y: 1.5, label: 'Present'},
    {x: 2, y: 1.5, label: 'Goal'},
    {x: 1, y: 2.5, label: 'Past'},
    {x: 1, y: 0.5, label: 'Context'},
    {x: 0, y: 1.5, label: 'Future'},
    {x: 3, y: 3, label: 'Querent'},
    {x: 3, y: 2, label: 'Environment'},
    {x: 3, y: 1, label: 'Mind'},
    {x: 3, y: 0, label: 'Outcome'}
  ];
  const scales = makeScales(container, [0, 1, 2, 3]);
  return {
    scales,
    positions: positions.map(({x, y, label, rotate}) => ({
      x: scales.xScale(x),
      y: y / 4,
      label,
      rotate
    }))
  };
}

const layoutMethod = {
  'Celtic Cross': celticCross,
  'Three Card': threeCard,
  'One Card': oneCard
};

/**
 * The main drawing step. Clears out previous content, identifies the relevant layout
 * draws everything
 *
 * container - the d3 selection for the full container pane
 * layout - a string specifying the layout
 * cards - an array of object with each individual card data
 */
function buildLayout(container, layout, cards) {
  // clear the contents of teh previous layout
  container.selectAll('*').remove();
  const {scales, positions} = layoutMethod[layout](container);
  // drawSidebar(container, scales);
  drawCardSpaces(container, positions, scales);
  drawCards(container, cards, scales, positions);
}
