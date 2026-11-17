package com.senai.lucas.maoamiga.config;

import com.senai.lucas.maoamiga.entity.Ponto;
import com.senai.lucas.maoamiga.repository.PontoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PontoRepository pontoRepository;

    @Override
    public void run(String... args) {
        if (pontoRepository.count() > 0) {
            return;
        }

        List<Ponto> iniciais = List.of(
                ponto("Ponto de Coleta Setor Bueno", "Rua T-30, nº 1200, Goiânia-GO", "Setor Bueno", "Seg a Sex, 8h às 17h", "coleta"),
                ponto("Ponto de Distribuição Vila Nova", "Avenida Anhanguera, nº 3400, Goiânia-GO", "Vila Nova", "Sáb, 7h às 12h", "distribuição"),
                ponto("Ponto de Coleta Setor Campinas", "Rua 3, nº 450, esquina com Av. Goiás, Goiânia-GO", "Setor Campinas", "Ter, Qui e Sáb, 9h às 15h", "coleta"),
                ponto("Ponto de Distribuição Setor Sul", "Avenida 85, nº 1500, Goiânia-GO", "Setor Sul", "Seg, Qua e Sex, 14h às 18h", "distribuição"),
                ponto("Ponto de Coleta Jardim América", "Rua 90, nº 320, Goiânia-GO", "Jardim América", "Ter e Qui, 8h às 12h", "coleta"),
                ponto("Ponto de Coleta Setor Pedro Ludovico", "Avenida Engler, nº 780, Goiânia-GO", "Setor Pedro Ludovico", "Seg a Sáb, 9h às 16h", "coleta"),
                ponto("Ponto de Distribuição Setor Coimbra", "Rua Coimbra, nº 210, Goiânia-GO", "Setor Coimbra", "Qua e Sex, 13h às 17h", "distribuição"),
                ponto("Ponto de Coleta Setor Marista", "Rua 9, nº 1330, Goiânia-GO", "Setor Marista", "Sáb e Dom, 8h às 13h", "coleta"),
                ponto("Centro Solidário Avenida Goiás", "Avenida Goiás, nº 610, Goiânia-GO", "Centro", "Seg a Sex, 8h às 18h", "coleta"),
                ponto("Casa de Apoio Praça Cívica", "Rua 4, nº 280, Goiânia-GO", "Centro", "Seg a Sáb, 9h às 17h", "distribuição"),
                ponto("Espaço Mão Amiga T-63", "Avenida T-63, nº 1420, Goiânia-GO", "Setor Bueno", "Seg a Sex, 9h às 18h", "distribuição"),
                ponto("Núcleo Comunitário Parque Vaca Brava", "Avenida T-10, nº 890, Goiânia-GO", "Setor Bueno", "Ter a Sáb, 8h às 14h", "coleta"),
                ponto("Ponto de Coleta Setor Oeste", "Rua 10, nº 540, Goiânia-GO", "Setor Oeste", "Seg a Sex, 8h às 17h", "coleta"),
                ponto("Central de Cestas Setor Oeste", "Avenida República do Líbano, nº 1120, Goiânia-GO", "Setor Oeste", "Qua e Sáb, 8h às 13h", "distribuição"),
                ponto("Ponto de Coleta Jardim Goiás", "Avenida Jamel Cecílio, nº 2150, Goiânia-GO", "Jardim Goiás", "Seg a Sex, 10h às 19h", "coleta"),
                ponto("Ponto de Distribuição Parque Flamboyant", "Rua 15, nº 740, Goiânia-GO", "Jardim Goiás", "Sáb, 8h às 14h", "distribuição"),
                ponto("Apoio Solidário Setor Bela Vista", "Avenida T-2, nº 980, Goiânia-GO", "Setor Bela Vista", "Seg a Sex, 8h às 16h", "coleta"),
                ponto("Ponto de Coleta Setor Universitário", "Rua 235, nº 415, Goiânia-GO", "Setor Universitário", "Seg a Sex, 8h às 17h", "coleta"),
                ponto("Distribuição Comunitária Universitário", "Praça Universitária, nº 90, Goiânia-GO", "Setor Universitário", "Ter e Qui, 14h às 18h", "distribuição"),
                ponto("Ponto de Coleta Setor Nova Suíça", "Avenida C-255, nº 330, Goiânia-GO", "Setor Nova Suíça", "Seg a Sáb, 8h às 15h", "coleta"),
                ponto("Ponto de Distribuição Parque Amazônia", "Avenida Rio Verde, nº 1680, Goiânia-GO", "Parque Amazônia", "Qua, Sex e Sáb, 9h às 16h", "distribuição"),
                ponto("Ponto de Coleta Setor Aeroporto", "Rua 18-A, nº 520, Goiânia-GO", "Setor Aeroporto", "Seg a Sex, 8h às 17h", "coleta"),
                ponto("Casa Solidária Setor Jaó", "Avenida Professor Venerando de Freitas, nº 430, Goiânia-GO", "Setor Jaó", "Ter a Sáb, 9h às 15h", "coleta"),
                ponto("Ponto de Distribuição Jardim Novo Mundo", "Avenida Nova York, nº 810, Goiânia-GO", "Jardim Novo Mundo", "Seg, Qua e Sex, 8h às 13h", "distribuição"),
                ponto("Ponto de Coleta Parque Atheneu", "Avenida Parque Atheneu, nº 1250, Goiânia-GO", "Parque Atheneu", "Seg a Sex, 9h às 17h", "coleta")
        );

        pontoRepository.saveAll(iniciais);
    }

    private Ponto ponto(String nome, String endereco, String bairro, String horario, String tipo) {
        return Ponto.builder()
                .nome(nome)
                .endereco(endereco)
                .bairro(bairro)
                .horario(horario)
                .tipo(tipo)
                .build();
    }
}
