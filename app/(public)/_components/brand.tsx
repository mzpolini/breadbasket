export function Sprout() {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 34V19M20 24C8 25 5 16 6 9c9-1 16 5 14 15ZM20 19C18 8 25 3 34 4c1 9-5 16-14 15Z" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function FieldArt() {
  return <svg className="field-art" viewBox="0 0 620 660" fill="none" aria-hidden="true"><circle cx="442" cy="135" r="79" fill="#db9b58"/><path d="M-50 350Q180 140 700 350V700H-50Z" fill="#73825a"/><path d="M-50 425Q270 200 690 450V700H-50Z" fill="#aeb48b"/><path d="M-50 580Q270 280 690 545V700H-50Z" fill="#b65a3d"/>{[0,1,2,3,4,5,6,7].map(i=><path key={i} d={`M${-200+i*95} 710Q${100+i*55} 420 650 ${480+i*25}`} stroke="#f3e9d2" strokeOpacity=".45" strokeWidth="2"/>)}<path d="M85 280V160M85 226C40 228 32 195 35 169c33-3 58 19 50 57ZM85 192c-6-41 20-61 53-56 3 34-19 59-53 56Z" stroke="#ede6ce" strokeWidth="3"/><g stroke="#eee8d5" strokeWidth="1.5"><path d="M475 294v28m-14-14h28M210 72v20m-10-10h20M530 68v14m-7-7h14"/></g><circle cx="173" cy="151" r="3" fill="#eee8d5"/><circle cx="394" cy="282" r="3" fill="#eee8d5"/></svg>
}

export function Conversation() {
  return <div className="conversation"><div className="conversation-head"><span className="avatar"><Sprout /></span><div><strong>Breadbasket</strong><small>A little conversation. A fresh start.</small></div><span aria-hidden="true">•••</span></div><div className="thread"><p className="thread-time">AN EXAMPLE FROM THE FIELD</p><div className="bubble outgoing">I have heirloom tomatoes, German Johnson and Brandywine, mixed bell peppers, and red okra. Head lettuce coming soon.</div><div className="bubble incoming"><strong>Here’s what I heard.</strong><p>Available: German Johnson & Brandywine tomatoes, mixed bell peppers, red okra.</p><p>Coming soon: head lettuce.</p><p>Ready to publish?</p></div><div className="bubble outgoing yes">Yes!</div><div className="published"><span aria-hidden="true">✓</span> Farmer confirmed. Ready for the week.</div></div><div className="conversation-foot">Your words. Your say. Your farm.</div></div>
}

export function StandPreview() {
  return <div className="stand-preview"><div className="stand-top"><Sprout /><span>FARM STAND · ILLUSTRATIVE EXAMPLE</span></div><h3>A good week<br />at the farm.</h3><p className="confirmed"><span /> Example: confirmed this morning</p><div className="stand-label">WHAT’S IN SEASON</div>{['Heirloom tomatoes', 'Mixed bell peppers', 'Red okra'].map((x,i)=><div className="produce-row" key={x}><span className={`produce-dot produce-${i}`} aria-hidden="true"/><span>{x}{i===0&&<small>German Johnson · Brandywine</small>}</span><span className="available">Available</span></div>)}<div className="coming"><span className="eyebrow">COMING SOON</span><p>“Head lettuce coming soon.”</p></div><p className="stand-caption">Grown by a neighbor. Shared in their own words.</p></div>
}
