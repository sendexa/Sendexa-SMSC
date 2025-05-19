import { logHelpers } from '../utils/logger';
import { NCAAuditLogger } from './audit-logger';

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'PROMOTIONAL' | 'TRANSACTIONAL' | 'SERVICE' | 'OTP';
  language: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED';
  variables: string[];
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  expiryDate?: Date;
}

export class TemplateRegistry {
  private static instance: TemplateRegistry;
  private templates: Map<string, MessageTemplate>;
  private auditLogger: NCAAuditLogger;

  private constructor() {
    this.templates = new Map();
    this.auditLogger = NCAAuditLogger.getInstance();
  }

  public static getInstance(): TemplateRegistry {
    if (!TemplateRegistry.instance) {
      TemplateRegistry.instance = new TemplateRegistry();
    }
    return TemplateRegistry.instance;
  }

  /**
   * Register a new message template
   */
  public registerTemplate(template: MessageTemplate): void {
    try {
      // Validate template
      this.validateTemplate(template);

      // Set initial status
      template.status = 'PENDING';

      // Store template
      this.templates.set(template.id, template);

      // Log the registration
      this.auditLogger.logTemplateUpdate({
        timestamp: new Date().toISOString(),
        action: 'REGISTER_TEMPLATE',
        details: {
          templateId: template.id,
          name: template.name,
          category: template.category
        },
        status: 'success',
        userId: template.createdBy
      });

      logHelpers.smpp('Message template registered', {
        templateId: template.id,
        category: template.category
      });
    } catch (error) {
      this.auditLogger.logTemplateUpdate({
        timestamp: new Date().toISOString(),
        action: 'REGISTER_TEMPLATE',
        details: {
          templateId: template.id,
          name: template.name,
          category: template.category
        },
        status: 'failure',
        errorMessage: (error as Error).message,
        userId: template.createdBy
      });

      throw error;
    }
  }

  /**
   * Update an existing template
   */
  public updateTemplate(
    templateId: string,
    updates: Partial<MessageTemplate>,
    updatedBy: string
  ): void {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Create updated template
      const updatedTemplate: MessageTemplate = {
        ...template,
        ...updates,
        updatedBy,
        updatedAt: new Date(),
        status: 'PENDING' // Reset status for re-approval
      };

      // Validate updated template
      this.validateTemplate(updatedTemplate);

      // Store updated template
      this.templates.set(templateId, updatedTemplate);

      // Log the update
      this.auditLogger.logTemplateUpdate({
        timestamp: new Date().toISOString(),
        action: 'UPDATE_TEMPLATE',
        details: {
          templateId,
          name: updatedTemplate.name,
          category: updatedTemplate.category
        },
        status: 'success',
        userId: updatedBy
      });

      logHelpers.smpp('Message template updated', {
        templateId,
        category: updatedTemplate.category
      });
    } catch (error) {
      this.auditLogger.logTemplateUpdate({
        timestamp: new Date().toISOString(),
        action: 'UPDATE_TEMPLATE',
        details: { templateId },
        status: 'failure',
        errorMessage: (error as Error).message,
        userId: updatedBy
      });

      throw error;
    }
  }

  /**
   * Approve a template
   */
  public approveTemplate(
    templateId: string,
    approvedBy: string,
    rejectionReason?: string
  ): void {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Update template status
      template.status = rejectionReason ? 'REJECTED' : 'ACTIVE';
      template.approvedBy = approvedBy;
      template.approvedAt = new Date();
      template.rejectionReason = rejectionReason;

      // Store updated template
      this.templates.set(templateId, template);

      // Log the approval/rejection
      this.auditLogger.logTemplateUpdate({
        timestamp: new Date().toISOString(),
        action: rejectionReason ? 'REJECT_TEMPLATE' : 'APPROVE_TEMPLATE',
        details: {
          templateId,
          name: template.name,
          category: template.category,
          rejectionReason
        },
        status: 'success',
        userId: approvedBy
      });

      logHelpers.smpp(
        rejectionReason ? 'Message template rejected' : 'Message template approved',
        {
          templateId,
          category: template.category
        }
      );
    } catch (error) {
      this.auditLogger.logTemplateUpdate({
        timestamp: new Date().toISOString(),
        action: rejectionReason ? 'REJECT_TEMPLATE' : 'APPROVE_TEMPLATE',
        details: { templateId },
        status: 'failure',
        errorMessage: (error as Error).message,
        userId: approvedBy
      });

      throw error;
    }
  }

  /**
   * Get a template by ID
   */
  public getTemplate(templateId: string): MessageTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates
   */
  public getAllTemplates(): MessageTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: MessageTemplate['category']): MessageTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Get active templates
   */
  public getActiveTemplates(): MessageTemplate[] {
    return this.getAllTemplates().filter(t => t.status === 'ACTIVE');
  }

  /**
   * Validate template content and structure
   */
  private validateTemplate(template: MessageTemplate): void {
    // Check required fields
    if (!template.id || !template.name || !template.content || !template.category) {
      throw new Error('Missing required template fields');
    }

    // Validate content length
    if (template.content.length > 160) {
      throw new Error('Template content exceeds maximum length of 160 characters');
    }

    // Validate variables
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const foundVariables = template.content.match(variableRegex) || [];
    const declaredVariables = template.variables || [];

    // Check if all variables in content are declared
    for (const variable of foundVariables) {
      const varName = variable.slice(2, -2);
      if (!declaredVariables.includes(varName)) {
        throw new Error(`Undeclared variable ${varName} in template content`);
      }
    }

    // Check if all declared variables are used
    for (const variable of declaredVariables) {
      if (!template.content.includes(`{{${variable}}}`)) {
        throw new Error(`Declared variable ${variable} not used in template content`);
      }
    }
  }
}
