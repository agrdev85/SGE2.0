import { db, CMSMenuItem } from './database';

// Helper function to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Pobla la base de datos con datos de ejemplo del CMS
 * Ejecutar esta función una sola vez para inicializar el contenido
 */
export function seedCMSData() {
  // Check if already seeded
  const existingPages = db.cmsPages.getAll();
  if (existingPages.length > 0) {
    console.log('CMS ya tiene datos, omitiendo seed...');
    return;
  }

  console.log('Inicializando datos del CMS...');

  // 1. Crear Categorías
  const techCategory = db.cmsCategories.create({
    name: 'Tecnología',
    slug: 'tecnologia',
    description: 'Artículos sobre tecnología y desarrollo',
    orderIndex: 1,
  });

  const scienceCategory = db.cmsCategories.create({
    name: 'Ciencia',
    slug: 'ciencia',
    description: 'Descubrimientos y avances científicos',
    orderIndex: 2,
  });

  const eventsCategory = db.cmsCategories.create({
    name: 'Eventos',
    slug: 'eventos',
    description: 'Información sobre congresos y eventos',
    orderIndex: 3,
  });

  // 2. Crear Páginas
  db.cmsPages.create({
    title: 'Inicio',
    slug: 'inicio',
    content: `
      <div class="hero-section">
        <h1>Bienvenido al Sistema de Gestión de Eventos</h1>
        <p class="lead">Plataforma integral para la gestión de congresos, ponencias y revisión por pares</p>
      </div>
      <div class="features">
        <h2>Características Principales</h2>
        <ul>
          <li>Gestión completa de abstracts y ponencias</li>
          <li>Sistema de revisión por pares</li>
          <li>Asignación inteligente de revisores</li>
          <li>Panel de administración SuperAdmin</li>
        </ul>
      </div>
    `,
    template: 'landing',
    status: 'published',
    author: 'admin',
    metaTitle: 'Sistema de Gestión de Eventos - Inicio',
    metaDescription: 'Plataforma completa para gestionar eventos científicos y académicos',
    publishedAt: new Date().toISOString(),
  });

  db.cmsPages.create({
    title: 'Acerca de Nosotros',
    slug: 'acerca',
    content: `
      <h1>Sobre el Sistema</h1>
      <p>Este sistema fue desarrollado para facilitar la gestión integral de eventos científicos y académicos.</p>
      
      <h2>Misión</h2>
      <p>Proporcionar una plataforma moderna, eficiente y fácil de usar para la organización de congresos científicos.</p>
      
      <h2>Visión</h2>
      <p>Ser la herramienta líder en la gestión de eventos académicos en América Latina.</p>
      
      <h2>Valores</h2>
      <ul>
        <li>Innovación tecnológica</li>
        <li>Transparencia en los procesos</li>
        <li>Excelencia académica</li>
        <li>Colaboración internacional</li>
      </ul>
    `,
    template: 'sidebar',
    status: 'published',
    author: 'admin',
    metaTitle: 'Acerca de Nosotros',
    metaDescription: 'Conoce más sobre nuestro sistema de gestión de eventos',
    publishedAt: new Date().toISOString(),
  });

  db.cmsPages.create({
    title: 'Contacto',
    slug: 'contacto',
    content: `
      <h1>Contacto</h1>
      <p>¿Tienes preguntas o necesitas ayuda? Estamos aquí para ayudarte.</p>
      
      <div class="contact-info">
        <h2>Información de Contacto</h2>
        <p><strong>Email:</strong> info@sistemasgeeventos.com</p>
        <p><strong>Teléfono:</strong> +1 (555) 123-4567</p>
        <p><strong>Dirección:</strong> 123 Calle Principal, Ciudad, País</p>
        <p><strong>Horario:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM</p>
      </div>
      
      <h2>Soporte Técnico</h2>
      <p>Para soporte técnico, por favor envía un email a: <a href="mailto:soporte@sistemageeventos.com">soporte@sistemageeventos.com</a></p>
    `,
    template: 'default',
    status: 'published',
    author: 'admin',
    metaTitle: 'Contacto - Sistema de Gestión de Eventos',
    metaDescription: 'Ponte en contacto con nosotros',
    publishedAt: new Date().toISOString(),
  });

  // 3. Crear Artículos
  db.cmsArticles.create({
    title: 'Introducción al Sistema de Gestión de Eventos',
    slug: 'introduccion-sistema',
    excerpt: 'Descubre cómo nuestro sistema puede transformar la organización de tus eventos científicos.',
    content: `
      <h2>¿Qué es el Sistema de Gestión de Eventos?</h2>
      <p>Nuestro sistema es una plataforma integral diseñada específicamente para la gestión de congresos, simposios y eventos científicos.</p>
      
      <h3>Características Principales</h3>
      <p>El sistema incluye módulos para:</p>
      <ul>
        <li>Recepción y gestión de abstracts</li>
        <li>Asignación de revisores</li>
        <li>Proceso de revisión por pares</li>
        <li>Gestión del programa científico</li>
        <li>Panel administrativo SuperAdmin</li>
      </ul>
      
      <h3>Beneficios</h3>
      <p>Al utilizar nuestra plataforma, los organizadores pueden:</p>
      <ul>
        <li>Automatizar procesos manuales</li>
        <li>Reducir errores humanos</li>
        <li>Mejorar la comunicación con autores y revisores</li>
        <li>Generar reportes detallados</li>
      </ul>
    `,
    categoryId: techCategory.id,
    tags: ['sistema', 'gestión', 'eventos', 'introducción'],
    featuredImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    author: 'admin',
    status: 'published',
    featured: true,
    publishedAt: new Date().toISOString(),
  });

  db.cmsArticles.create({
    title: 'Cómo Enviar tu Abstract',
    slug: 'como-enviar-abstract',
    excerpt: 'Guía paso a paso para enviar tu trabajo al congreso utilizando nuestro sistema.',
    content: `
      <h2>Guía para Autores</h2>
      <p>Enviar tu abstract es un proceso simple y directo. Sigue estos pasos:</p>
      
      <h3>Paso 1: Registro</h3>
      <p>Primero, debes crear una cuenta en el sistema. Haz clic en "Registrarse" y completa el formulario con tus datos.</p>
      
      <h3>Paso 2: Iniciar Sesión</h3>
      <p>Una vez registrado, inicia sesión con tu email y contraseña.</p>
      
      <h3>Paso 3: Nuevo Abstract</h3>
      <p>Ve a la sección "Abstracts" y haz clic en "Nuevo Abstract".</p>
      
      <h3>Paso 4: Completar Información</h3>
      <p>Completa todos los campos requeridos:</p>
      <ul>
        <li>Título del trabajo</li>
        <li>Autores y co-autores</li>
        <li>Temática</li>
        <li>Tipo de presentación</li>
        <li>Resumen (máximo 300 palabras)</li>
      </ul>
      
      <h3>Paso 5: Enviar</h3>
      <p>Revisa toda la información y haz clic en "Enviar". Recibirás una confirmación por email.</p>
    `,
    categoryId: eventsCategory.id,
    tags: ['guía', 'autores', 'abstract', 'tutorial'],
    featuredImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    author: 'admin',
    status: 'published',
    featured: true,
    publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  });

  db.cmsArticles.create({
    title: 'El Proceso de Revisión por Pares',
    slug: 'proceso-revision',
    excerpt: 'Conoce cómo funciona el proceso de revisión y qué criterios se utilizan.',
    content: `
      <h2>Revisión por Pares</h2>
      <p>Todos los trabajos enviados pasan por un riguroso proceso de revisión por pares.</p>
      
      <h3>¿Qué es la Revisión por Pares?</h3>
      <p>Es un proceso en el cual expertos en el área evalúan la calidad, originalidad y relevancia de los trabajos enviados.</p>
      
      <h3>Criterios de Evaluación</h3>
      <p>Los revisores evalúan los trabajos basándose en:</p>
      <ul>
        <li>Originalidad y novedad</li>
        <li>Metodología aplicada</li>
        <li>Claridad de la presentación</li>
        <li>Relevancia para el congreso</li>
        <li>Referencias bibliográficas</li>
      </ul>
      
      <h3>Tiempo de Revisión</h3>
      <p>El proceso de revisión toma aproximadamente 2-3 semanas. Los autores recibirán notificación del resultado.</p>
      
      <h3>Posibles Resultados</h3>
      <ul>
        <li><strong>Aceptado:</strong> El trabajo se acepta sin cambios</li>
        <li><strong>Aceptado con modificaciones:</strong> Se requieren cambios menores</li>
        <li><strong>Rechazado:</strong> El trabajo no cumple con los criterios</li>
      </ul>
    `,
    categoryId: scienceCategory.id,
    tags: ['revisión', 'pares', 'evaluación', 'proceso'],
    featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    author: 'admin',
    status: 'published',
    featured: false,
    publishedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  });

  db.cmsArticles.create({
    title: 'Nuevas Funcionalidades del CMS',
    slug: 'nuevas-funcionalidades-cms',
    excerpt: 'Descubre las últimas características añadidas al sistema de gestión de contenidos.',
    content: `
      <h2>Actualizaciones Recientes</h2>
      <p>Hemos implementado un sistema CMS completo similar a Drupal.</p>
      
      <h3>Gestión de Páginas</h3>
      <p>Ahora puedes crear páginas personalizadas con diferentes plantillas.</p>
      
      <h3>Sistema de Blog</h3>
      <p>Publica artículos, organízalos por categorías y etiquetas.</p>
      
      <h3>Menús Dinámicos</h3>
      <p>Crea menús personalizados con enlaces a páginas, artículos o URLs externas.</p>
      
      <h3>Widgets</h3>
      <p>Agrega widgets al sidebar, header o footer de tu sitio.</p>
    `,
    categoryId: techCategory.id,
    tags: ['cms', 'actualización', 'funcionalidades'],
    featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    author: 'admin',
    status: 'published',
    featured: true,
    publishedAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  });

  // 4. Crear Menús
  const inicioPage = db.cmsPages.getBySlug('inicio');
  const acercaPage = db.cmsPages.getBySlug('acerca');
  const contactoPage = db.cmsPages.getBySlug('contacto');

  db.cmsMenus.create({
    name: 'Menú Principal',
    location: 'header',
    isActive: true,
    items: [
      {
        id: generateId(),
        label: 'Inicio',
        type: 'page',
        pageId: inicioPage?.id,
        url: '/pagina/inicio',
        orderIndex: 1,
        openInNewTab: false,
        isActive: true,
      } as CMSMenuItem,
      {
        id: generateId(),
        label: 'Blog',
        type: 'custom',
        url: '/blog',
        orderIndex: 2,
        openInNewTab: false,
        isActive: true,
      } as CMSMenuItem,
      {
        id: generateId(),
        label: 'Acerca',
        type: 'page',
        pageId: acercaPage?.id,
        url: '/pagina/acerca',
        orderIndex: 3,
        openInNewTab: false,
        isActive: true,
      } as CMSMenuItem,
      {
        id: generateId(),
        label: 'Contacto',
        type: 'page',
        pageId: contactoPage?.id,
        url: '/pagina/contacto',
        orderIndex: 4,
        openInNewTab: false,
        isActive: true,
      } as CMSMenuItem,
    ],
  });

  db.cmsMenus.create({
    name: 'Menú Footer',
    location: 'footer',
    isActive: true,
    items: [
      {
        id: generateId(),
        label: 'Términos y Condiciones',
        type: 'custom',
        url: '/terminos',
        orderIndex: 1,
        openInNewTab: false,
        isActive: true,
      } as CMSMenuItem,
      {
        id: generateId(),
        label: 'Política de Privacidad',
        type: 'custom',
        url: '/privacidad',
        orderIndex: 2,
        openInNewTab: false,
        isActive: true,
      } as CMSMenuItem,
    ],
  });

  // 5. Crear Widgets
  db.cmsWidgets.create({
    name: 'Artículos Recientes',
    type: 'recent-articles',
    location: 'sidebar',
    orderIndex: 1,
    isActive: true,
  });

  db.cmsWidgets.create({
    name: 'Categorías',
    type: 'categories',
    location: 'sidebar',
    orderIndex: 2,
    isActive: true,
  });

  db.cmsWidgets.create({
    name: 'Búsqueda',
    type: 'search',
    location: 'sidebar',
    orderIndex: 3,
    isActive: true,
  });

  db.cmsWidgets.create({
    name: 'Bienvenida',
    type: 'text',
    location: 'sidebar',
    content: 'Bienvenido a nuestro sitio. Explora nuestros artículos y recursos.',
    orderIndex: 0,
    isActive: true,
  });

  // 6. Configuraciones del Sistema
  db.cmsSettings.update({
    siteName: 'Sistema de Gestión de Eventos',
    siteDescription: 'Plataforma integral para eventos científicos',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    contactInfo: {
      email: 'info@sistemageventos.com',
      phone: '+1 (555) 123-4567',
      address: '123 Calle Principal, Ciudad, País',
    },
  });

  console.log('✅ Datos del CMS inicializados correctamente');
  console.log(`- ${db.cmsCategories.getAll().length} categorías creadas`);
  console.log(`- ${db.cmsPages.getAll().length} páginas creadas`);
  console.log(`- ${db.cmsArticles.getAll().length} artículos creados`);
  console.log(`- ${db.cmsMenus.getAll().length} menús creados`);
  console.log(`- ${db.cmsWidgets.getAll().length} widgets creados`);
}
