import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { findCategory, type Product } from '@/data/site';
import type { Formato } from '@/data/formatos';
import s from './ProductCard.module.css';

export function ProductCard({ product }: { product: Product }) {
  const category = findCategory(product.category);

  /* Sem prefetch: o site é estático e responde em ~115ms, mas o App Router
     baixava e desserializava o payload RSC de cada card visível — 121 kB de
     trabalho de main thread por página, sem ganho perceptível na navegação. */
  return (
    <Link href={`/produtos/${product.slug}`} className={s.card} prefetch={false}>
      <div className={s.thumb}>
        <Image
          src={product.image}
          alt={product.name}
          width={400}
          height={300}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <div className={s.body}>
        {category ? <span className={s.line}>{category.name}</span> : null}
        <h3 className={s.name}>{product.name}</h3>
        <p className={s.lead}>{product.lead}</p>
        <span className={s.more}>
          Ver produto
          <Icon name="arrow-right" size={16} strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

/**
 * Card de formato, para a vitrine.
 *
 * Cordão, manta, rolo e travesseiro são peças que o cliente procura pelo nome
 * — o site anterior os listava assim. Usa a foto da Linha Branca como capa e
 * indica em quantas linhas o formato existe.
 */
export function FormatoCard({ formato }: { formato: Formato }) {
  const capa = formato.variants[0];

  return (
    <Link href={`/produtos/formato/${formato.slug}`} className={s.card} prefetch={false}>
      <div className={s.thumb}>
        <Image
          src={capa.image}
          alt={formato.name}
          width={400}
          height={300}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>
      <div className={s.body}>
        <span className={s.line}>
          {formato.variants.length > 1
            ? `Disponível nas ${formato.variants.length} linhas`
            : 'Linha Branca'}
        </span>
        <h3 className={s.name}>{formato.name}</h3>
        <p className={s.lead}>{formato.lead}</p>
        <span className={s.more}>
          Ver formato
          <Icon name="arrow-right" size={16} strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}
