import { useState } from 'react'
import { useWallet } from '../context/WalletContext.jsx'
import Modal from '../components/Modal.jsx'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, QrCode, Shield, Share, Info } from '../components/Icons.jsx'

function AddressCard({ title, address, shielded, onQR, note }) {
  const { copyToClipboard } = useWallet()
  const [infoOpen, setInfoOpen] = useState(false)
  const short = address ? `${address.slice(0, 14)}…${address.slice(-8)}` : '—'

  return (
    <div className={`card ${shielded ? 'card-shielded' : ''}`} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: shielded ? 'rgba(107,69,232,0.25)' : 'var(--bg-input)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: '#F4B728',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white', position: 'relative',
            }}>
              Ƶ
              {shielded && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 14, height: 14, background: 'var(--accent)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 8,
                }}>
                  <Shield size={8} />
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
            <div className="address-mono" style={{ fontSize: 12 }}>{short}</div>
            {note && (
              <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>{note}</div>
            )}
          </div>
        </div>

        <button className="btn-icon" onClick={() => setInfoOpen(v => !v)} style={{ flexShrink: 0 }}>
          <Info size={16} />
        </button>
      </div>

      {infoOpen && (
        <div style={{
          marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)',
          borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)',
          lineHeight: 1.6, animation: 'slideUp 0.15s ease',
        }}>
          {shielded
            ? 'Shielded (transparent) addresses start with "t1" and are visible on the public blockchain. Shielded spending (u1) is coming in a future update.'
            : 'Transparent addresses start with "t1" and are visible on the public blockchain. Use only when required.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 16 }}>
        {[
          { icon: Copy, label: 'Copy', action: () => copyToClipboard(address, 'Address') },
          { icon: QrCode, label: 'QR Code', action: onQR },
          {
            icon: Share, label: 'Request', action: () => {
              if (navigator.share) navigator.share({ text: address })
              else copyToClipboard(address, 'Address')
            }
          },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 8px',
              background: shielded ? 'rgba(107,69,232,0.15)' : 'var(--bg-input)',
              border: `1px solid ${shielded ? 'rgba(107,69,232,0.2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Receive() {
  const { wallet, copyToClipboard } = useWallet()
  const [qrOpen, setQrOpen] = useState(false)

  const address = wallet?.address || ''

  return (
    <div className="page page-enter">
      <div className="page-header">
        <span className="page-title">Receive ZEC</span>
      </div>

      <AddressCard
        title="Zcash Address (Transparent)"
        address={address}
        shielded
        onQR={() => setQrOpen(true)}
        note="Transparent t1… address. Shielded (u1…) coming soon."
      />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 24, padding: '12px', color: 'var(--text-muted)', fontSize: 13,
      }}>
        <Shield size={16} />
        <span>Send only ZEC (Zcash) to this address.</span>
      </div>

      {/* QR Code Modal */}
      {qrOpen && (
        <Modal
          title="Zcash Address"
          onClose={() => setQrOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => copyToClipboard(address, 'Address')}>
                <Copy size={16} /> Copy Address
              </button>
              <button
                className="btn btn-accent"
                onClick={() => {
                  if (navigator.share) navigator.share({ text: address })
                  else copyToClipboard(address, 'Address')
                }}
              >
                <Share size={16} /> Share
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {address ? (
              <div style={{
                padding: 16, background: 'white', borderRadius: 12,
                display: 'inline-flex',
              }}>
                <QRCodeSVG
                  value={address}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            ) : (
              <div style={{ width: 232, height: 232, background: 'var(--bg-card)', borderRadius: 12 }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
              <p className="address-mono" style={{ fontSize: 11, maxWidth: 320, textAlign: 'center', wordBreak: 'break-all' }}>
                {address}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
