import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Room } from './types';

export function HandoffsPanel({room,onAgent,onTask,taskId}:{room:Room;onAgent:(id:string)=>void;onTask:(id:string)=>void;taskId?:string}) {
  const [pending,setPending]=useState(false);
  const messages=room.messages.filter(m=>(!taskId || m.workItemId===taskId || m.evidenceLinks?.some(l=>l.workItemId===taskId)) && (!pending || m.disposition==='investigate' || (m.status && m.status!=='acknowledged'))).slice().reverse();
  return <section className="handoffs-panel"><h2>Handoffs</h2>
    <div className="handoff-filter"><button aria-pressed={!pending} onClick={()=>setPending(false)}>All</button><button aria-pressed={pending} onClick={()=>setPending(true)}>Needs follow-up</button></div>
    {room.demo && <p className="quiet-copy">Demo exchanges · no model execution.</p>}
    {!messages.length && <p className="quiet-copy">{pending?'No handoffs awaiting acknowledgment.':'No handoffs yet.'}</p>}
    {messages.map(m=><article className="peer-message" key={m.id}>
      <header><button disabled={!room.agents.some(a=>a.id===m.fromId)} onClick={()=>m.fromId && onAgent(m.fromId)}>{m.from}</button><ArrowRight size={13}/><button disabled={!room.agents.some(a=>a.id===m.toId)} onClick={()=>m.toId && onAgent(m.toId)}>{m.to}</button><time>{new Date(m.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></header>
      {m.fromOwner && <p className="peer-office-context">{m.fromOwner}’s office → {m.toOwner}’s office{m.sentByOwner?' · sent by owner':''}</p>}
      <div className="peer-meta"><span>{m.kind || 'Result'}</span><span className={`delivery-${m.status || 'recorded'}`}>{m.status==='delivered'?'Delivered · not acknowledged':m.status==='queued'?'Queued for next turn':m.status==='acknowledged'?'Acknowledged':'Recorded'}</span></div>
      {m.workItemId && room.workItems.some(t=>t.id===m.workItemId) && <button className="peer-task" onClick={()=>onTask(m.workItemId!)}>{room.workItems.find(t=>t.id===m.workItemId)?.title} <ArrowRight size={12}/></button>}
      {m.replyTo && <p className="peer-reply">Reply to {room.messages.find(p=>p.id===m.replyTo)?.from || 'an earlier handoff'}</p>}
      {m.text.length>320?<details className="peer-long-message"><summary>{m.text.slice(0,160)}…</summary><p className="peer-text">{m.text}</p></details>:<p className="peer-text">{m.text}</p>}
      {m.deliveryError && <p className="quiet-copy">{m.deliveryError}</p>}
      {m.acknowledgement && <div className="peer-ack"><b>{m.disposition==='applied'?'Applied · reported':m.disposition==='investigate'?'Investigating':m.disposition==='not-applicable'?'Not applicable':`${m.to} acknowledged`}</b><p>{m.acknowledgement}</p></div>}
      {m.evidenceLinks?.map(link=>{const ticket=room.workItems.find(t=>t.id===link.workItemId),receipt=ticket?.evidence.find(e=>e.id===link.receiptId);return receipt?<details className="peer-artifact" key={link.receiptId}><summary>{receipt.kind==='test'?(receipt.passed===true?'Passing check':receipt.passed===false?'Failed check':'Test result · reported'):receipt.kind} · {ticket?.title}</summary><small>{receipt.source || 'Reported evidence'}</small><pre>{receipt.text}</pre><button className="text-button" onClick={()=>onTask(link.workItemId)}>Open ticket <ArrowRight size={12}/></button></details>:<p className="quiet-copy" key={link.receiptId}>{m.remoteEvidence?'Evidence reported in teammate’s office; not verified in this checkout.':'Linked receipt is no longer available.'}</p>;})}
    </article>)}
  </section>;
}
