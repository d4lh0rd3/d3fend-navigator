// Réaligne les mappings D3FEND -> ATT&CK sur la version courante d'ATT&CK.
//
// D3FEND référence les identifiants ATT&CK tels qu'ils existaient lors de sa publication.
// ATT&CK révoque ensuite certaines techniques (ex. T1562.003 -> T1690) ou les déplace de
// tactique (ex. vers "defense-impairment") : ATT&CK Navigator ignore alors ces entrées.
//
// Pour chaque mapping Enterprise / ICS :
// - technique révoquée avec remplaçant (relations `revoked-by`, chaînes suivies) : l'ID et le
//   nom sont remplacés, l'ID d'origine est conservé dans `originalOffensiveTechniqueId` ;
// - tactique D3FEND qui n'est plus une tactique de la technique (résolue) : le mapping est
//   décliné sur chacune des tactiques courantes de la technique, la tactique d'origine est
//   conservée dans `originalOffensiveTacticId` ;
// - technique dépréciée, révoquée sans remplaçant ou inconnue : mapping conservé tel quel
//   (information D3FEND), mais marqué via `offensiveTechniqueStatus` pour être exclu des
//   exports ATT&CK Navigator.
// Les autres frameworks (SPARTA…) ne sont pas modifiés.

const MAX_REVOCATION_CHAIN = 10;

function resolveRevocation(catalog, techniqueId) {
  let id = techniqueId;
  for (let i = 0; i < MAX_REVOCATION_CHAIN; i++) {
    const t = catalog.techniques.get(id);
    if (!t) return { id, technique: null };
    if (!t.revoked) return { id, technique: t };
    if (!t.replacedBy) return { id, technique: t };
    id = t.replacedBy;
  }
  return { id, technique: catalog.techniques.get(id) ?? null };
}

function parentOf(techniqueId) {
  const dot = techniqueId.indexOf(".");
  return dot > 0 ? techniqueId.slice(0, dot) : null;
}

export function resolveAttackMappings(mappings, catalogs) {
  const resolved = [];
  const stats = {
    remappedTechniques: new Map(), // ancien ID -> nouvel ID
    remappedTactics: 0,
    excluded: new Map(), // ID -> statut
  };

  for (const m of mappings) {
    const base = { ...m, offensiveTechniqueStatus: "active", originalOffensiveTechniqueId: null, originalOffensiveTacticId: null };
    const catalog = catalogs[m.offensiveFramework];
    if (!catalog) {
      resolved.push(base);
      continue;
    }

    const { id, technique } = resolveRevocation(catalog, m.offensiveTechniqueId);
    if (!technique || technique.deprecated || technique.revoked) {
      const status = !technique ? "unknown" : technique.revoked ? "revoked" : "deprecated";
      stats.excluded.set(m.offensiveTechniqueId, status);
      resolved.push({ ...base, offensiveTechniqueStatus: status });
      continue;
    }

    if (id !== m.offensiveTechniqueId) {
      stats.remappedTechniques.set(m.offensiveTechniqueId, id);
      Object.assign(base, {
        offensiveTechniqueStatus: "remapped",
        originalOffensiveTechniqueId: m.offensiveTechniqueId,
        offensiveTechniqueId: id,
        offensiveTechniqueName: technique.name,
        offensiveParentTechniqueId: parentOf(id),
      });
    }
    if (m.offensiveFramework === "attack-enterprise") {
      base.offensivePlatforms = technique.platforms;
    }

    const originalShortname = m.offensiveTacticId ? catalog.tactics.get(m.offensiveTacticId)?.shortname : undefined;
    if (originalShortname && technique.tactics.includes(originalShortname)) {
      base.offensiveTacticName = catalog.tactics.get(m.offensiveTacticId).name;
      resolved.push(base);
      continue;
    }

    // tactique d'origine absente ou obsolète : une ligne par tactique courante de la technique
    const currentTacticIds = technique.tactics
      .map((shortname) => catalog.tacticIdByShortname.get(shortname))
      .filter(Boolean);
    if (!currentTacticIds.length) {
      resolved.push(base);
      continue;
    }
    stats.remappedTactics += 1;
    for (const tacticId of currentTacticIds) {
      resolved.push({
        ...base,
        offensiveTacticId: tacticId,
        offensiveTacticName: catalog.tactics.get(tacticId).name,
        originalOffensiveTacticId: m.offensiveTacticId,
      });
    }
  }

  // identifiants séquentiels (la déclinaison par tactique peut ajouter des lignes)
  resolved.forEach((m, i) => (m.id = `map-${i + 1}`));

  return { mappings: resolved, stats };
}
