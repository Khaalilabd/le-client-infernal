// Options du module (domaines suggérés, niveaux, profils de personnalité), chargées une fois.
import { useEffect, useState } from 'react';
import { clientGeneratorApi } from '../api.js';

let cache = null;

export function useClientGeneratorOptions() {
  const [options, setOptions] = useState(cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache) return;
    clientGeneratorApi
      .getOptions()
      .then((data) => {
        cache = data;
        setOptions(data);
      })
      .catch(setError);
  }, []);

  return { options, error };
}

/** Libellé d'un profil de personnalité à partir de son identifiant. */
export function profileLabel(options, profileId) {
  return options?.personalities.find((profile) => profile.id === profileId)?.label;
}
