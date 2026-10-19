import { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';
import SessionPicker, { useSelectedSessionId } from '../../../shared/components/SessionPicker.jsx';
import ErrorMessage from '../../../shared/components/ErrorMessage.jsx';
import Loader from '../../../shared/components/Loader.jsx';
import ChangeRequestCard from '../components/ChangeRequestCard.jsx';
import RespondForm from '../components/RespondForm.jsx';
import { changeRequestsApi } from '../api.js';
import '../change-requests.css';

const MAX_REQUESTS = 3;

/** Stepper – situe l'étudiant dans le parcours de séance. */
function SessionStepper() {
    return (
        <ol className="stepper cr-stepper-wrapper">
            <li className="step is-done">Scénario</li>
            <li className="step is-done">Entretien</li>
            <li className="step is-done">Cahier des charges</li>
            <li className="step is-current">Changements</li>
            <li className="step">Évaluation</li>
        </ol>
    );
}

export default function ChangeRequestsPage() {
    const { user } = useAuth();
    const sessionId = useSelectedSessionId();

    const [changeRequests, setChangeRequests] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Identifiant de la demande dont le formulaire est ouvert
    const [activeId, setActiveId] = useState(null);

    const isStudent = user?.role === 'STUDENT';

    // ── Chargement de la liste ──────────────────────────────────────────────
    useEffect(() => {
        if (!sessionId) return;
        setChangeRequests(null);
        setError(null);
        setActiveId(null);
        changeRequestsApi
            .list(sessionId)
            .then((list) => {
                setChangeRequests(list);
                // Ouvre automatiquement la première demande PENDING
                const first = list.find((cr) => cr.status === 'PENDING');
                if (first) setActiveId(first.id);
            })
            .catch(setError);
    }, [sessionId]);

    // ── Génération d'une nouvelle demande ───────────────────────────────────
    async function handleGenerate() {
        setGenerating(true);
        setError(null);
        try {
            const cr = await changeRequestsApi.generate(sessionId);
            setChangeRequests((prev) => [...(prev ?? []), cr]);
            setActiveId(cr.id);
        } catch (err) {
            setError(err);
        } finally {
            setGenerating(false);
        }
    }

    // ── Réponse à une demande ───────────────────────────────────────────────
    async function handleRespond(changeRequestId, { decision, justification }) {
        const { changeRequest, clientReaction } = await changeRequestsApi.respond(changeRequestId, {
            decision,
            justification,
        });
        // Met à jour la liste localement
        setChangeRequests((prev) =>
            prev.map((cr) => (cr.id === changeRequestId ? { ...changeRequest, clientReaction } : cr)),
        );
        setActiveId(null);
        return clientReaction;
    }

    // ── Calculs dérivés ─────────────────────────────────────────────────────
    const pendingCount = (changeRequests ?? []).filter((cr) => cr.status === 'PENDING').length;
    const canGenerate =
        isStudent && sessionId && changeRequests !== null && changeRequests.length < MAX_REQUESTS;

    const activeCr = activeId ? (changeRequests ?? []).find((cr) => cr.id === activeId) : null;
    const history = (changeRequests ?? []).filter((cr) => cr.status === 'ANSWERED');
    const pending = (changeRequests ?? []).filter((cr) => cr.status === 'PENDING');

    // ── Rendu ───────────────────────────────────────────────────────────────
    return (
        <section>
            {/* En-tête de page */}
            <div className="page-header">
                <div>
                    <span className="eyebrow">Module 3</span>
                    <h1>
                        Demandes de changement
                        {pendingCount > 0 && (
                            <span className="cr-pending-badge" aria-label={`${pendingCount} demande(s) en attente`}>
                                {pendingCount}
                            </span>
                        )}
                    </h1>
                    <p>En cours de projet, le client change d&apos;avis. À vous de décider : accepter, négocier ou refuser, en le justifiant.</p>
                </div>
                {canGenerate && (
                    <div className="page-header-actions">
                        <button
                            id="btn-generate-change-request"
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? 'Le client rédige sa demande…' : 'Recevoir une nouvelle demande'}
                        </button>
                    </div>
                )}
            </div>

            {/* Sélecteur de séance */}
            <SessionPicker />

            {/* Erreur globale */}
            {error && <ErrorMessage error={error} onRetry={error?.status === 409 ? undefined : () => setError(null)} />}

            {/* Stepper (si une séance est sélectionnée) */}
            {sessionId && <SessionStepper />}

            {/* Contenu principal */}
            {sessionId &&
                (changeRequests === null && !error ? (
                    <Loader />
                ) : (
                    <div className="cr-layout">
                        {/* Colonne principale : demande active */}
                        <div className="stack" style={{ marginTop: 0 }}>
                            {pending.length === 0 && history.length === 0 && (
                                <div className="cr-empty-state">
                                    <p className="muted">Aucune demande de changement reçue pour l&apos;instant.</p>
                                    {canGenerate && (
                                        <button
                                            id="btn-generate-empty"
                                            type="button"
                                            className="btn"
                                            onClick={handleGenerate}
                                            disabled={generating}
                                        >
                                            {generating ? 'Le client rédige sa demande…' : 'Recevoir la première demande'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Demandes en attente */}
                            {pending.map((cr, index) => (
                                <div key={cr.id}>
                                    {/* Carte de la demande */}
                                    <article className="card cr-request-card">
                                        <div className="card-header">
                                            <div>
                                                <span className="eyebrow">Demande n° {index + 1} · reçue le {new Date(cr.createdAt).toLocaleDateString('fr-FR')}</span>
                                                <h3>{cr.title}</h3>
                                            </div>
                                            <span className="badge badge-warning">En attente</span>
                                        </div>
                                        <p>{cr.description}</p>
                                        <div className="cr-reason-quote">« {cr.reason} »</div>
                                        <div className="cluster small">
                                            <span className="chip">Impact : {cr.impact?.scope}</span>
                                            <span className="chip">Effort : {EFFORT_LABELS[cr.impact?.effort] ?? cr.impact?.effort}</span>
                                            <span className="chip">Risque : {cr.impact?.risk}</span>
                                        </div>
                                    </article>

                                    {/* Formulaire de réponse (uniquement pour l'étudiant) */}
                                    {isStudent && (
                                        <RespondForm
                                            changeRequestId={cr.id}
                                            onRespond={handleRespond}
                                        />
                                    )}
                                </div>
                            ))}

                            {/* Demandes déjà traitées (affichées en bas de la colonne principale si pas d'historique) */}
                            {pending.length === 0 &&
                                history.length > 0 &&
                                history.map((cr) => (
                                    <ChangeRequestCard key={cr.id} changeRequest={cr} index={(changeRequests ?? []).indexOf(cr)} />
                                ))}
                        </div>

                        {/* Colonne latérale : historique des demandes traitées */}
                        <aside className="stack" style={{ marginTop: 0 }}>
                            <h3>
                                Historique
                                {changeRequests && (
                                    <span className="muted" style={{ fontWeight: 400, fontSize: '0.85em', marginLeft: 8 }}>
                                        ({history.length} / {MAX_REQUESTS})
                                    </span>
                                )}
                            </h3>
                            {history.length === 0 ? (
                                <p className="muted small">Aucune réponse soumise pour l&apos;instant.</p>
                            ) : (
                                history.map((cr) => <ChangeRequestCard key={cr.id} changeRequest={cr} compact />)
                            )}
                        </aside>
                    </div>
                ))}
        </section>
    );
}

const EFFORT_LABELS = { LOW: 'faible', MEDIUM: 'moyen', HIGH: 'élevé' };
