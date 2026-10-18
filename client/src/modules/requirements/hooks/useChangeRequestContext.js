// Contexte d'une demande de changement reçue depuis le module 3 (?changeRequest=<id> dans l'URL).
// Le serveur revérifie tout à l'enregistrement : ce hook ne sert qu'à afficher un message clair.
import { useEffect, useState } from 'react';
import { requirementsApi } from '../api.js';

const USABLE_DECISIONS = ['ACCEPT', 'NEGOTIATE'];

export function useChangeRequestContext(sessionId, changeRequestId) {
  const [state, setState] = useState({ loading: false, changeRequest: null, usedInVersion: null, problem: null, error: null });

  useEffect(() => {
    if (!sessionId || !changeRequestId) {
      setState({ loading: false, changeRequest: null, usedInVersion: null, problem: null, error: null });
      return;
    }
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    Promise.all([requirementsApi.listChangeRequests(sessionId), requirementsApi.listVersions(sessionId, { changeRequestId })])
      .then(([changeRequests, versions]) => {
        if (cancelled) return;
        const changeRequest = changeRequests.find((item) => item.id === changeRequestId) ?? null;
        let problem = null;
        if (!changeRequest) problem = 'Cette demande de changement est introuvable pour la séance choisie.';
        else if (changeRequest.status !== 'ANSWERED' || !USABLE_DECISIONS.includes(changeRequest.decision)) {
          problem = 'Seule une demande de changement acceptée ou négociée peut faire évoluer le cahier des charges.';
        }
        setState({ loading: false, changeRequest, usedInVersion: versions[0]?.version ?? null, problem, error: null });
      })
      .catch((error) => !cancelled && setState({ loading: false, changeRequest: null, usedInVersion: null, problem: null, error }));

    return () => {
      cancelled = true;
    };
  }, [sessionId, changeRequestId]);

  return state;
}
