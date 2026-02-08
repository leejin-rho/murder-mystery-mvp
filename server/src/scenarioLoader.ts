import * as fs from 'fs';
import * as path from 'path';
import { Scenario, Scene } from './types';

export class ScenarioLoader {
  private scenarios: Map<string, Scenario> = new Map();

  constructor() {
    this.loadScenarios();
  }

  private loadScenarios(): void {
    const scenariosDir = path.join(__dirname, '../scenarios');
    
    if (!fs.existsSync(scenariosDir)) {
      console.error('Scenarios directory not found!');
      process.exit(1);
    }

    const files = fs.readdirSync(scenariosDir).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      console.error('No scenario files found!');
      process.exit(1);
    }

    for (const file of files) {
      const filePath = path.join(scenariosDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      try {
        const scenario: Scenario = JSON.parse(content);
        this.validateScenario(scenario);
        this.scenarios.set(scenario.id, scenario);
        console.log(`✓ Loaded scenario: ${scenario.title} (${scenario.id})`);
      } catch (error) {
        console.error(`✗ Failed to load scenario ${file}:`, error);
        process.exit(1);
      }
    }
  }

  private validateScenario(scenario: Scenario): void {
    // Check required fields
    if (!scenario.id || !scenario.title || !scenario.startSceneId) {
      throw new Error('Missing required scenario fields');
    }

    if (!scenario.roles || scenario.roles.length === 0) {
      throw new Error('Scenario must have at least one role');
    }

    if (!scenario.scenes || scenario.scenes.length === 0) {
      throw new Error('Scenario must have at least one scene');
    }

    // Build scene ID map
    const sceneIds = new Set<string>();
    scenario.scenes.forEach(scene => {
      sceneIds.add(scene.id);
    });

    // Validate startSceneId exists
    if (!sceneIds.has(scenario.startSceneId)) {
      throw new Error(`Start scene '${scenario.startSceneId}' not found`);
    }

    // Validate all 'next' references
    scenario.scenes.forEach(scene => {
      if (scene.type === 'narration') {
        if (!sceneIds.has(scene.next)) {
          throw new Error(`Scene '${scene.id}' references invalid next scene '${scene.next}'`);
        }
      } else if (scene.type === 'choice') {
        scene.choices.forEach(choice => {
          if (!sceneIds.has(choice.next)) {
            throw new Error(`Choice '${choice.id}' in scene '${scene.id}' references invalid next scene '${choice.next}'`);
          }
        });
      }
    });

    // Validate role IDs in privateByRole
    const roleIds = new Set(scenario.roles.map(r => r.id));
    scenario.scenes.forEach(scene => {
      if (scene.privateByRole) {
        Object.keys(scene.privateByRole).forEach(roleId => {
          if (!roleIds.has(roleId)) {
            throw new Error(`Scene '${scene.id}' references invalid role '${roleId}'`);
          }
        });
      }
    });
  }

  getScenario(id: string): Scenario | undefined {
    return this.scenarios.get(id);
  }

  getDefaultScenario(): Scenario {
    const first = Array.from(this.scenarios.values())[0];
    if (!first) {
      throw new Error('No scenarios available');
    }
    return first;
  }

  getAllScenarios(): Scenario[] {
    return Array.from(this.scenarios.values());
  }
}
