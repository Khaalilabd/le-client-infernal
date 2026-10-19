import { useState } from 'react';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';

const DECISIONS = [
    { value: 'ACCEPT', label: 'Accepter', description: 'Intégrer le changement tel quel' },
    { value: 'NEGOTIATE', label: 'Négocier', description: 'Proposer une alternative ou un report' },
    { value: 'REFUSE', label: 'Refuser', description: "Expliquer pourquoi ce n'est pas souhaitable" },
];

/**
 * Formulaire de réponse à une demande de changement.
 * Props :
 *   - changeRequestId : string
 *   - onRespond(changeRequestId, { decision, justification }) : Promise<clientReaction>
 */
export default function RespondForm({ changeRequestId, onRespond }) {
    const [decision, setDecision] = useState('NEGOTIATE');
    const [justification, setJustification] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [clientReaction, setClientReaction] = useState(null);

    // Si on a déjà soumis et reçu la réaction du client, on l'affiche
    if (clientReaction) {
        return (
            <div className="card" style={{ marginTop: 0 }}>
                <h3>Réponse envoyée ✓</h3>
                <div className="cr-client-reaction">
                    <strong>Réaction du client :</strong> « {clientReaction} »
                </div>
            </div>
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (justification.trim().length < 20) return;
        setSubmitting(true);
        setError(null);
        try {
            const reaction = await onRespond(changeRequestId, { decision, justification: justification.trim() });
            setClientReaction(reaction);
        } catch (err) {
            setError(err);
        } finally {
            setSubmitting(false);
        }
    }

    const charCount = justification.trim().length;
    const tooShort = charCount < 20;

    return (
        <form id={`respond-form-${changeRequestId}`} className="card stack cr-respond-form" style={{ marginTop: 0 }} onSubmit={handleSubmit}>
            <h3>Votre réponse</h3>

            {/* Choix exclusif de décision */}
            <div className="choice-group cr-choice-group" role="group" aria-label="Choisissez votre décision">
                {DECISIONS.map((d) => (
                    <label
                        key={d.value}
                        className={`choice${decision === d.value ? ' is-selected' : ''}`}
                        htmlFor={`decision-${changeRequestId}-${d.value}`}
                    >
                        <input
                            id={`decision-${changeRequestId}-${d.value}`}
                            type="radio"
                            name={`decision-${changeRequestId}`}
                            value={d.value}
                            checked={decision === d.value}
                            onChange={() => setDecision(d.value)}
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        />
                        <strong>{d.label}</strong>
                        <span>{d.description}</span>
                    </label>
                ))}
            </div>

            {/* Justification */}
            <label htmlFor={`justification-${changeRequestId}`}>
                Justification
                <textarea
                    id={`justification-${changeRequestId}`}
                    rows={4}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Expliquez votre décision en mentionnant l'impact sur le délai, le coût ou la qualité…"
                    disabled={submitting}
                    required
                />
                <span className={`field-hint${tooShort && charCount > 0 ? ' field-error' : ''}`}>
                    {charCount < 20
                        ? `Encore ${20 - charCount} caractère(s) minimum.`
                        : 'Parlez délai, coût, risque et proposez une alternative si vous négociez ou refusez.'}
                </span>
            </label>

            {/* Erreur de soumission */}
            {error && <ErrorMessage error={error} onRetry={() => setError(null)} />}

            {/* Actions */}
            <div className="card-footer" style={{ marginTop: 0 }}>
                <button
                    id={`btn-submit-respond-${changeRequestId}`}
                    type="submit"
                    className="btn"
                    disabled={submitting || tooShort}
                >
                    {submitting ? 'Évaluation en cours…' : 'Envoyer ma réponse'}
                </button>
            </div>
        </form>
    );
}
