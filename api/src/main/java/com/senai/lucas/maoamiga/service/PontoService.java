package com.senai.lucas.maoamiga.service;

import com.senai.lucas.maoamiga.dto.PontoRequestDTO;
import com.senai.lucas.maoamiga.dto.PontoResponseDTO;
import com.senai.lucas.maoamiga.entity.Ponto;
import com.senai.lucas.maoamiga.repository.PontoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PontoService {

    private final PontoRepository pontoRepository;

    @Transactional(readOnly = true)
    public List<PontoResponseDTO> findAll() {
        return pontoRepository.findAll()
                .stream()
                .map(PontoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public PontoResponseDTO findById(UUID id) {
        Ponto ponto = buscarEntidadePorIdOu404(id);
        return PontoResponseDTO.fromEntity(ponto);
    }

    @Transactional
    public PontoResponseDTO save(PontoRequestDTO dto) {
        Ponto salvo = pontoRepository.save(dto.toEntity());
        return PontoResponseDTO.fromEntity(salvo);
    }

    @Transactional
    public PontoResponseDTO update(UUID pontoId, PontoRequestDTO dto) {
        Ponto existente = buscarEntidadePorIdOu404(pontoId);
        existente.setNome(dto.nome().trim());
        existente.setEndereco(dto.endereco().trim());
        existente.setBairro(dto.bairro().trim());
        existente.setHorario(dto.horario().trim());
        existente.setTipo(dto.tipo().trim());
        Ponto atualizado = pontoRepository.save(existente);
        return PontoResponseDTO.fromEntity(atualizado);
    }

    @Transactional
    public void delete(UUID pontoId) {
        Ponto existente = buscarEntidadePorIdOu404(pontoId);
        pontoRepository.delete(existente);
    }

    private Ponto buscarEntidadePorIdOu404(UUID id) {
        return pontoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ponto não encontrado para o ID: " + id
                ));
    }
}

