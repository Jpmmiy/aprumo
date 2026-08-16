import { Route, Routes } from 'react-router-dom'
import { configurado } from '@/lib/supabase'
import { ProvedorAuth, useAuth } from '@/dados/auth'
import { ProvedorDados } from '@/dados/loja'
import { ProvedorCronometro } from '@/dados/cronometro'
import { Casca, TelaCarregando } from '@/componentes/Casca'
import { Configurar } from '@/telas/Configurar'
import { Entrar } from '@/telas/Entrar'
import { Hoje } from '@/telas/Hoje'
import { Estudar } from '@/telas/Estudar'
import { Desempenho } from '@/telas/Desempenho'
import { Rotina } from '@/telas/Rotina'
import { Anotacoes } from '@/telas/Anotacoes'
import { Ajustes } from '@/telas/Ajustes'

function Roteador() {
  const { sessao, carregando } = useAuth()

  if (carregando) return <TelaCarregando mensagem="Abrindo o Aprumo" />
  if (!sessao) return <Entrar />

  return (
    <ProvedorDados>
      <ProvedorCronometro>
        <Casca>
          <Routes>
            <Route path="/" element={<Hoje />} />
            <Route path="/estudar" element={<Estudar />} />
            <Route path="/desempenho" element={<Desempenho />} />
            <Route path="/rotina" element={<Rotina />} />
            <Route path="/anotacoes" element={<Anotacoes />} />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route path="*" element={<Hoje />} />
          </Routes>
        </Casca>
      </ProvedorCronometro>
    </ProvedorDados>
  )
}

export function App() {
  // Sem as chaves do Supabase não há o que autenticar: o app abre no guia.
  if (!configurado) return <Configurar />

  return (
    <ProvedorAuth>
      <Roteador />
    </ProvedorAuth>
  )
}
