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
          /* MEDIDO, não estimado. O `sizes` anterior era
             `(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw` e errava
             nas duas direções, porque descrevia a COLUNA DO GRID e não a
             largura real da imagem: o card tem borda de 1px de cada lado e o
             grid tem gap de 24px, e a soma disso desloca a conta.

             Largura real da <img>, medida a dpr 1 em cada degrau:
               390 -> 348    412 -> 370    640 -> 598
               641 -> 286,5  768 -> 224,7  900 -> 260,7  1024 -> 302
               1025+ -> 387,3 (trava no container de 1280)

             Contra o que o `sizes` antigo declarava:
               768  pedia 50vw = 384 para uma caixa de 225  -> 1,7x de pixels
               900  pedia 50vw = 450 para uma caixa de 261  -> 1,7x
               1024 pedia 50vw = 512 para uma caixa de 302  -> 1,7x
               1280 pedia 25vw = 320 para uma caixa de 387  -> AMPLIAÇÃO 1,2x

             O 25vw era o pior dos dois: acima de 1024 ele fica ABAIXO da
             caixa e o navegador estica a variante, exatamente o defeito que o
             hero já tinha. Aqui as calc() reproduzem a geometria do grid:

               >1024: (1280 - 2*32 - 2*24)/3 = 389,3, travado pelo container
               768-1024: (100vw - 2*32 - 24)/2  (2 colunas, gutter-lg 32)
               641-767:  (100vw - 2*24 - 24)/2  (page-pad-x 24)
               <=640:    1 coluna, a largura da página menos o padding

             ENTRE 768 E 1024 O `sizes` NÃO PODE SER EXATO, e isso é
             deliberado. O número de colunas ali depende da CONTAGEM de cards,
             não só da largura — Layout.module.css tem
             `.cols3:has(> :nth-child(3n):last-child)`, que dá três colunas aos
             grupos de 3, 6 e 9 e deixa os de 4 em duas. O `sizes` não enxerga
             a contagem de filhos, então declara a hipótese MAIOR (duas
             colunas). Sobra pixel nos grupos de três, mas nunca falta em
             nenhum dos dois — e faltar é que borra.

             Acima de 1024 a caixa é 387,3 e o degrau útil é o de 384: pedir
             390 (a largura da célula do grid) passava 6px do candidato e fazia
             o navegador subir para 640w, quase o dobro dos bytes por 6px. Os
             384 são 0,8% menores que a caixa — invisível numa foto de produto
             sob `object-fit: cover`, e é o que mantém o degrau certo. */
          sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) calc((100vw - 88px) / 2), 384px"
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
        {/* Mesmo grid, mesmo card, mesmo `sizes` — ver o comentário longo em
            ProductCard acima para a medição que gerou estes valores. */}
        <Image
          src={capa.image}
          alt={formato.name}
          width={400}
          height={300}
          sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) calc((100vw - 88px) / 2), 384px"
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
