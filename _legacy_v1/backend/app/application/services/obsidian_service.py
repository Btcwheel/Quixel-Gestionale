"""Obsidian service for synchronizing project data with Obsidian vault."""

import os
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path

from app.domain.models import Project, ProjectPlan, ProjectDiscussion, ChatLog
from app.domain.schemas import ProjectPlanResponse, ProjectDiscussionResponse, ChatLogResponse


class ObsidianService:
    """Service for synchronizing project data with Obsidian vault."""
    
    def __init__(self):
        # In a real implementation, this would come from config/environment
        self.vault_path = os.getenv("OBSIDIAN_VAULT_PATH", 
                                   "C:/Users/Quixel/Documents/ObsidianVault")
        self.projects_path = os.path.join(self.vault_path, "Projects")
        
        # Ensure projects directory exists
        os.makedirs(self.projects_path, exist_ok=True)
    
    def _get_project_path(self, project_name: str) -> Path:
        """Get the path for a project's Obsidian folder."""
        # Sanitize project name for filesystem use
        safe_name = "".join(c for c in project_name if c.isalnum() or c in (" ", "-", "_")).rstrip()
        return Path(self.projects_path) / safe_name
    
    def sync_project_to_obsidian(self, project: Project) -> bool:
        """Sync a project's data to Obsidian vault."""
        try:
            project_path = self._get_project_path(project.name)
            os.makedirs(project_path, exist_ok=True)
            
            # Create README.md with project overview
            self._create_project_readme(project_path, project)
            
            # Create discussions folder and sync discussions
            discussions_path = project_path / "discussioni"
            os.makedirs(discussions_path, exist_ok=True)
            # Note: In a real implementation, we'd fetch discussions from DB
            
            # Create decisions file
            self._create_decisions_file(project_path, project)
            
            # Create context file for LLM
            self._create_context_file(project_path, project)
            
            return True
        except Exception as e:
            print(f"Error syncing project to Obsidian: {e}")
            return False
    
    def _create_project_readme(self, project_path: Path, project: Project) -> None:
        """Create or update the project README file."""
        readme_path = project_path / "README.md"
        
        content = f"""# {project.name}

## Descrizione
{project.description or "Nessuna descrizione disponibile"}

## Informazioni
- **Data di creazione**: {project.created_at.strftime('%d/%m/%Y') if project.created_at else "N/A"}
- **Stato**: {project.status}

## Collegamenti Rapidi
- [Piano di Lavoro](piano.md)
- [Discussioni](./discussioni/)
- [Decisioni](decisioni.md)
- [Contesto per LLM](contesto.md)

## Ultimo Aggiornamento
{datetime.now().strftime('%d/%m/%Y alle %H:%M')}
"""
        
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(content)
    
    def _create_decisions_file(self, project_path: Path, project: Project) -> None:
        """Create decisions file."""
        decisions_path = project_path / "decisioni.md"
        
        # In a real implementation, we'd fetch actual decisions from DB
        content = f"""# Decisioni del Progetto {project.name}

*Ultimo aggiornamento: {datetime.now().strftime('%d/%m/%Y alle %H:%M')}*

## Decisioni Prese

### Nessuna decisione registrata ancora
Le decisioni verranno estratte automaticamente dalle discussioni AI e registrate qui.

## Come funzionano le decisioni
Le decisioni vengono estratte dalle discussioni con l'AI quando contengono linguaggio decisionale definitivo come:
- "Abbiamo deciso di..."
- "La decisione finale è..."
- "Concludiamo che..."
- "Procederemo con..."

Questo file verrà aggiornato automaticamente man mano che aggiungi discussioni al progetto.
"""
        
        with open(decisions_path, "w", encoding="utf-8") as f:
            f.write(content)
    
    def _create_context_file(self, project_path: Path, project: Project) -> None:
        """Create context file for LLM consumption."""
        context_path = project_path / "contesto.md"
        
        # In a real implementation, we'd fetch actual context from DB
        content = f"""# Contesto per LLM - Progetto {project.name}

*Ultimo aggiornamento: {datetime.now().strftime('%d/%m/%Y alle %H:%M')}*

## Overview Progetto
**Nome**: {project.name}
**Descrizione**: {project.description or "Nessuna descrizione disponibile"}
**Stato**: {project.status}
**Data di creazione**: {project.created_at.strftime('%d/%m/%Y') if project.created_at else "N/A"}

## Istruzioni per l'AI
Quando lavori su questo progetto, considera sempre:
1. Gli obiettivi dichiarati nella descrizione
2. Le decisioni già prese (vedi decisioni.md)
3. Le discussioni precedenti nella cartella discussioni/
4. Qualsiasi vincolo tecnico o di business specificato

## Come utilizzare questo contesto
Questo file dovrebbe essere fornito come contesto iniziale quando:
- Inizi una nuova discussione su questo progetto
- Chiedi consigli su problemi specifici
- Richiedi revisione di lavoro esistente
- Pianifichi prossimi passi

## Aggiornamento automatico
Questo file viene aggiornato automaticamente dal sistema di gestione progetti.
Non modificare manualmente questa sezione superiore.
"""
        
        with open(context_path, "w", encoding="utf-8") as f:
            f.write(content)
    
    def get_project_notes(self, project_name: str) -> List[str]:
        """Get list of note files for a project."""
        try:
            project_path = self._get_project_path(project_name)
            if not project_path.exists():
                return []
            
            notes = []
            for file_path in project_path.rglob("*.md"):
                if file_path.is_file():
                    notes.append(str(file_path.relative_to(self.vault_path)))
            
            return sorted(notes)
        except Exception:
            return []
    
    def read_note(self, note_path: str) -> Optional[str]:
        """Read a note from the Obsidian vault."""
        try:
            full_path = Path(self.vault_path) / note_path
            if not full_path.exists():
                return None
            
            with open(full_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:
            return None
    
    def write_note(self, note_path: str, content: str) -> bool:
        """Write a note to the Obsidian vault."""
        try:
            full_path = Path(self.vault_path) / note_path
            # Ensure directory exists
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except Exception:
            return False