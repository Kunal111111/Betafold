'use client'
import { useEffect, useRef } from 'react'

interface Props {
  pdbId?: string
}

export default function MolstarViewer({ pdbId }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<any>(null)

  useEffect(() => {
    const initViewer = async () => {
      if (viewerRef.current && !pluginRef.current && pdbId && pdbId !== 'None' && pdbId !== '') {
         try {
             // Dynamically import styles and UMD script ONLY on client side
             await import('pdbe-molstar/build/pdbe-molstar-light.css');
             // @ts-ignore
             const js = await import('pdbe-molstar/build/pdbe-molstar-plugin.js');
             
             let PluginClass = (window as any).PDBeMolstarPlugin;
             if (!PluginClass && js && js.default) PluginClass = js.default;
             
             if (PluginClass) {
                 pluginRef.current = new PluginClass();
                 const options = {
                     moleculeId: pdbId.toLowerCase(),
                     hideControls: true, 
                     hideExpandIcon: true,
                     hideAnimationIcon: true,
                     hideSelectionIcon: true,
                     hideSettingsIcon: true,
                     hideWater: true,
                     hideHeteroatoms: true,
                     bgColor: {r: 11, g: 15, b: 25}
                 };
                 pluginRef.current.render(viewerRef.current, options);
             }
         } catch(err) {
             console.error("Failed to load native PDBeMolstar", err);
         }
      }
    }
    initViewer();
  }, [pdbId]);

  useEffect(() => {
    const handleAction = (e: any) => {
      const action = e.detail;
      if (pluginRef.current && action && action.command === 'highlight') {
         pluginRef.current.visual.clearSelection();
         pluginRef.current.visual.select({
             data: [{
                 start_residue_number: action.start_residue,
                 end_residue_number: action.end_residue,
                 color: action.color || { r: 255, g: 0, b: 0 },
                 focus: true
             }]
         });
      }
    };
    window.addEventListener('molstar-action', handleAction);
    return () => window.removeEventListener('molstar-action', handleAction);
  }, []);

  if (!pdbId || pdbId === 'None' || pdbId === '') {
    return (
      <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>No experimental PDB structure matched for 3D visualization. Transformer prediction fallback used.</p>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: 24 }}>
      <style>{`
        /* Prevent Molstar from hijacking the page scroll */
        html, body {
            overflow: auto !important;
            height: auto !important;
        }
        /* Force Molstar UI controls and icons to black */
        .msp-plugin .msp-icon,
        .msp-plugin .msp-btn-icon,
        .msp-plugin button,
        .msp-plugin .msp-control-button {
             color: #000 !important;
        }
        .msp-plugin svg {
             fill: #000 !important;
             stroke: #000 !important;
        }
        .msp-plugin .msp-current {
             color: #000 !important;
        }
        .msp-plugin .msp-btn:hover {
             background-color: rgba(0,0,0,0.1) !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600 }}>Interactive 3D Viewer (Mol*)</h3>
        <span style={{ fontSize: 13, color: 'var(--muted)', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: 12 }}>
          PDB Match: {pdbId.toUpperCase()}
        </span>
      </div>
      <div style={{ width: '100%', height: 600, position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: '#0b0f19' }}>
        <div ref={viewerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      </div>
    </div>
  )
}
