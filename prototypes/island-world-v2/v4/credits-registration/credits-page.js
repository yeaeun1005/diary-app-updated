/* Material descriptions and attribution, without external link controls. */
function CreditsPage(props) {
  const h = React.createElement;
  const row = item => h('tr', {key:item.id},
    h('td', {className:'v4-credit-kind'}, item.kind),
    h('td', {className:'v4-credit-description'}, item.description,
      item.keywords && h('small', null, item.keywords)),
    h('td', {className:'v4-credit-source'},
      h('span', {className:'v4-credit-source-label', 'aria-hidden':true}, '출처 '),
      h('span', null, item.by),
      item.note && h('small', null, item.note)));
  const section = (entry, index) => h('section', {
    key:entry.title, className:'v4-credits-section', 'aria-labelledby':'credits-section-'+index
  },
    h('h2', {id:'credits-section-'+index}, entry.title),
    h('table', {'aria-label':entry.title+' 자료와 출처'},
      h('colgroup', null, h('col', {className:'v4-credit-kind-col'}), h('col'), h('col', {className:'v4-credit-source-col'})),
      h('thead', null, h('tr', null,
        h('th', {scope:'col'}, '자료 형태'),
        h('th', {scope:'col'}, '자료 설명'),
        h('th', {scope:'col'}, '출처'))),
      h('tbody', null, entry.items.map(row))));
  return h('main', {className:'v4-readable-page v4-credits-page'},
    h('div', {className:'v4-credits-wrap'},
      h('button', {className:'v4-credits-back', onClick:props.onHome}, '← 홈으로'),
      h('article', {className:'v4-credits-card'},
        h('header', {className:'v4-credits-heading'},
          h('h1', null, '출처와 저작권'),
          h('p', null, CREDITS.intro)),
        CREDITS.sections.map(section),
        h('footer', null, CREDITS.outro))));
}
