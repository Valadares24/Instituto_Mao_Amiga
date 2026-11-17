package com.senai.lucas.maoamiga.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "TB_PONTO")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ponto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String endereco;

    @Column(nullable = false)
    private String bairro;

    @Column(nullable = false)
    private String horario;

    @Column(nullable = false)
    private String tipo;
}

